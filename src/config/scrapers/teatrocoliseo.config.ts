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
    // TODO: Validar la URL correcta de la página de cartelera
    // Opciones comunes: /cartelera, /eventos, /programacion, /agenda
    url: '/cartelera',

    // TODO: Validar selectores con DevTools
    // Contenedor principal (opcional - mejora performance)
    containerSelector: '.cartelera, .eventos, .programacion',

    // TODO: Validar selector de cada evento
    // Selectores comunes: .evento, .show, .event-card, .card, .item
    itemSelector: '.evento, .event-card, .show',

    // Asumimos que no hay paginación inicialmente
    // Si hay paginación, actualizar después de validar
    pagination: {
      type: 'none',
    },
  },

  selectors: {
    // TODO: Validar TODOS estos selectores con DevTools
    // Estos son patrones comunes en sitios de teatro argentinos

    // Título del evento
    // Selectores comunes: h2, h3, .title, .event-title, .nombre
    title: 'h2, h3, .title, .event-title',

    // Fecha del evento
    // Selectores comunes: .fecha, .date, time, .when
    date: '.fecha, .date, time',

    // Imagen del evento
    // Selectores comunes: img@src, .poster img@src, .imagen img@src
    image: 'img@src',

    // Link a detalles del evento
    // Selectores comunes: a@href, .ver-mas@href, .link@href
    link: 'a@href',

    // Precio (puede no estar en el listado)
    // Selectores comunes: .precio, .price, .valor
    price: '.precio, .price',

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
    // Transformación de fechas
    // TODO: Validar formato de fechas en el sitio
    // Opciones comunes:
    // - parseSpanishDate: para "15 de marzo de 2025" o "15/03/2025"
    // - parseLivepassDate: para "09 NOV" (sin año)
    // - parseLivepassDateTime: para "9 de noviembre de 2025 a las 21:00"
    date: 'parseSpanishDate',

    // Convertir URLs relativas a absolutas
    image: 'toAbsoluteUrl',
    link: 'toAbsoluteUrl',

    // Limpiar whitespace
    title: 'cleanWhitespace',

    // Extraer precio si está en formato "$1.500" o "Desde $1.500"
    price: 'extractPrice',
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
  // TODO: Habilitar después de validar que funciona el listado
  detailPage: {
    enabled: false, // Deshabilitar hasta validar selectores
    delayBetweenRequests: 500, // 500ms entre requests de detalles

    selectors: {
      // TODO: Validar estos selectores en una página de detalle específica
      date: '.fecha, .date, time',
      venue: '.venue, .lugar, .teatro',
      address: '.direccion, .address',
      price: '.precio, .price',
      description: '.descripcion, .description, .info',
      title: 'h1',
      image: 'meta[property="og:image"]@content, img.poster@src',
      category: '.categoria, .category, .genero',
    },

    defaultValues: {
      venue: 'Teatro Coliseo',
      city: 'Buenos Aires',
      country: 'AR',
      address: 'Marcelo T. de Alvear 1125, C1058 CABA',
    },

    transforms: {
      date: 'parseSpanishDate',
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
