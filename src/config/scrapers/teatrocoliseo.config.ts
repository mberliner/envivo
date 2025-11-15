/**
 * Teatro Coliseo Scraper Configuration
 *
 * Configuración para scraping de eventos del Teatro Coliseo
 * https://www.teatrocoliseo.org.ar
 *
 * IMPORTANTE: Los selectores CSS necesitan ser validados manualmente
 * ya que el sitio tiene protección contra bots (403).
 *
 * Para validar selectores:
 * 1. Abrir https://www.teatrocoliseo.org.ar en Chrome/Firefox
 * 2. Abrir DevTools (F12)
 * 3. Ir a la consola y probar: $$('.selector-aqui')
 * 4. Ajustar selectores según sea necesario
 *
 * Actualizado: Noviembre 2025
 */

import { ScraperConfig } from '@/features/events/data/sources/web/types/ScraperConfig';

export const teatroColiseoConfig: ScraperConfig = {
  name: 'teatrocoliseo',
  type: 'web',
  baseUrl: 'https://www.teatrocoliseo.org.ar',

  listing: {
    // URL validada: /cartelera
    url: '/cartelera',

    // Contenedor principal: SOLO la sección de "PROGRAMACIÓN ACTUAL"
    // Usar un selector más específico que filtre solo esa sección
    containerSelector: '#programacion-actual .vc_grid-container, [id*="actual"] .vc_grid-container, .programacion-actual .vc_grid-container',

    // Cada evento es un grid-item dentro del contenedor de programación actual
    itemSelector: '.vc_grid-item',

    // No hay paginación (todos los eventos en una página)
    pagination: {
      type: 'none',
    },
  },

  selectors: {
    // Título del evento (incluye fecha en el texto, separada por <br>)
    // Ejemplo: "ENRIQUE PIÑEYRO <br> VOLAR ES HUMANO, ATERRIZAR ES DIVINO <br> OCTUBRE-NOVIEMBRE<BR> 2025"
    title: '.vc_custom_heading h4 a',

    // Fecha: NO hay selector separado, está incluida en el título
    // Se parseará del título o se obtendrá de la página de detalle
    date: undefined,

    // Imagen: usa lazy loading con data-src
    image: '.vc_gitem-zone-img@data-src',

    // Link a página de detalle
    link: 'a.vc_gitem-link@href',

    // Precio: NO disponible en el listado, solo en página de detalle
    price: undefined,

    // Campos sin selector (usamos defaultValues)
    venue: undefined,
    city: undefined,
    country: undefined,
    address: undefined,
    category: undefined,
    description: undefined,
  },

  // Valores hardcodeados para campos sin selector
  defaultValues: {
    venue: 'Teatro Coliseo',
    city: 'Buenos Aires',
    country: 'AR',
    address: 'Marcelo T. de Alvear 1125, C1058 CABA',
    // Categorías múltiples: Teatro, Concierto, Festival
    // Por defecto usamos Teatro, pero puede ajustarse según el evento
    category: 'Teatro',
  },

  transforms: {
    // Limpiar título: remover <br> y normalizar espacios
    // El título viene como "TITULO <br> FECHA <br> AÑO"
    title: 'cleanWhitespace',

    // Convertir URLs relativas a absolutas
    image: 'toAbsoluteUrl',
    link: 'toAbsoluteUrl',
  },

  rateLimit: {
    requestsPerSecond: 1, // Conservador: 1 request/segundo
    timeout: 15000, // 15 segundos
  },

  errorHandling: {
    skipFailedEvents: true, // Continuar si un evento falla
    skipFailedPages: false, // Fallar si una página completa falla
    retry: {
      maxRetries: 3,
      initialDelay: 1000, // 1 segundo
      backoffMultiplier: 2, // 1s, 2s, 4s
    },
    timeout: 15000,
  },

  userAgent: 'EnVivoBot/1.0 (+https://envivo.ar/bot)',

  headers: {
    Accept: 'text/html,application/xhtml+xml',
    'Accept-Language': 'es-AR,es;q=0.9',
  },

  // Configuración para scraping de página de detalles
  // HABILITADO: La fecha y otros datos solo están disponibles en la página de detalle
  detailPage: {
    enabled: true,
    delayBetweenRequests: 500, // 500ms entre requests de detalles

    selectors: {
      // Selectores para la página de detalle (a validar)
      // Los datos estarán en el contenido de la página individual
      date: '.entry-content .wpb_wrapper p, .event-date, time',
      venue: undefined, // Siempre es Teatro Coliseo
      address: undefined, // Siempre es la misma dirección
      price: '.precio, .price, .entry-content strong',
      description: '.entry-content .wpb_wrapper',
      title: 'h1.entry-title, .entry-header h1',
      image: 'meta[property="og:image"]@content',
      category: undefined, // Determinar por tipo de evento
    },

    defaultValues: {
      venue: 'Teatro Coliseo',
      city: 'Buenos Aires',
      country: 'AR',
      address: 'Marcelo T. de Alvear 1125, C1058 CABA',
      category: 'Teatro', // Default, puede variar por evento
    },

    transforms: {
      date: 'parseTeatroColiseoDate',
      description: 'sanitizeHtml',
      price: 'extractPrice',
      image: 'toAbsoluteUrl',
      title: 'cleanWhitespace',
    },
  },
};

/**
 * NOTAS SOBRE TEATRO COLISEO:
 *
 * 0. SECCIÓN A SCRAPEAR:
 *    - SOLO scrapear eventos de "PROGRAMACIÓN ACTUAL"
 *    - NO scrapear "PRÓXIMAMENTE", "ESTRENOS" u otras secciones
 *    - El containerSelector debe filtrar solo esa sección específica
 *    - Si el selector falla, inspeccionar manualmente la estructura HTML
 *    - Ver cuál es el ID o clase del contenedor de "PROGRAMACIÓN ACTUAL"
 *
 * 1. PROTECCIÓN CONTRA BOTS:
 *    - El sitio devuelve 403 Forbidden para requests automáticos
 *    - Puede requerir ajustes en headers o rate limiting más agresivo
 *    - Validar manualmente que el sitio permite scraping
 *
 * 2. SELECTORES CSS:
 *    - TODOS los selectores necesitan validación manual con DevTools
 *    - Los selectores actuales son genéricos basados en patrones comunes
 *    - Ajustar según la estructura real del HTML
 *
 * 3. CATEGORÍAS:
 *    - Teatro Coliseo ofrece: Teatro, Conciertos, Festivales
 *    - Puede requerir detección dinámica de categoría por evento
 *    - Actualmente usa "Teatro" por defecto
 *
 * 4. FORMATO DE FECHAS:
 *    - Validar el formato exacto usado en el sitio
 *    - Ajustar transform según sea necesario
 *
 * 5. PÁGINA DE DETALLES:
 *    - Inicialmente deshabilitada (enabled: false)
 *    - Habilitar después de validar que el listado funciona
 *    - Validar selectores en una página de evento específica
 *
 * 6. VALIDACIÓN:
 *    - Ejecutar: ts-node scripts/test-teatrocoliseo.ts
 *    - Si falla, ajustar selectores y reintentar
 *    - Verificar que no se violen términos de servicio del sitio
 */
