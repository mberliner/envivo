/**
 * Teatro Vorterix Scraper Configuration
 *
 * Configuración para scraping de eventos del Teatro Vorterix
 * https://www.allaccess.com.ar/venue/teatro-vorterix
 *
 * El sitio usa la plataforma Crowder (mismo backend que AllAccess).
 * Estructura HTML simple y consistente.
 *
 * Actualizado: Noviembre 2025
 */

import { ScraperConfig } from '@/features/events/data/sources/web/types/ScraperConfig';

export const teatroVorterixConfig: ScraperConfig = {
  name: 'teatrovorterix',
  type: 'web',
  baseUrl: 'https://www.allaccess.com.ar',

  listing: {
    // URL del venue en AllAccess
    url: '/venue/teatro-vorterix',

    // No hay contenedor específico, los eventos están directamente en el body
    containerSelector: undefined,

    // Cada evento es un <a> con clases col-sm-6 col-md-4
    // Contiene un div.show-thumb con la info del evento
    itemSelector: 'a.col-sm-6.col-md-4',

    // No hay paginación (todos los eventos en una página)
    pagination: {
      type: 'none',
    },
  },

  selectors: {
    // Título: <h2> dentro de .show-info
    title: '.show-info h2',

    // Fecha: <h3> dentro de .show-info
    // Formato: "29 de Noviembre", "12 de Diciembre 2025", "21&nbsp;de Noviembre"
    date: '.show-info h3',

    // Imagen: <img> con src (no lazy loading, ya tiene el src directo)
    image: '.show-thumb img@src',

    // Link: el href del <a> (relativo: ../event/nombre-evento)
    link: '@href',

    // Campos sin selector (usamos defaultValues)
    venue: undefined,
    city: undefined,
    country: undefined,
    address: undefined,
    price: undefined,
    category: undefined,
    description: undefined,
  },

  // Valores hardcodeados para campos sin selector
  defaultValues: {
    venue: 'Teatro Vorterix',
    city: 'Buenos Aires',
    country: 'AR',
    address: 'Av. Federico Lacroze 3455, C1427 CABA',
    category: 'Concierto',
  },

  transforms: {
    // Parsear fechas de Teatro Vorterix: maneja &nbsp;, fechas sin año, múltiples fechas
    // "29 de Noviembre" → Date
    // "12 de Diciembre 2025" → Date
    // "21&nbsp;de Noviembre" → Date
    // "28 de Noviembre y 5 de Diciembre" → Date (toma la primera)
    date: 'parseTeatroVorterixDate',

    // Convertir URLs relativas a absolutas
    // ../event/nombre → https://www.allaccess.com.ar/event/nombre
    image: 'toAbsoluteUrl',
    link: 'toAbsoluteUrl',

    // Limpiar título: normalizar espacios y caracteres especiales
    // "FIESTA FOREVER 90s - Edición EGRESADOS" → mismo texto limpio
    title: 'cleanWhitespace',
  },

  rateLimit: {
    requestsPerSecond: 1, // Conservador: 1 request/segundo
    timeout: 15000, // 15 segundos
  },

  errorHandling: {
    skipFailedEvents: true, // Continuar si un evento falla
    skipFailedPages: false, // Fallar si la página principal falla
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
  // OPCIONAL: Habilitar si se necesita información adicional (precio, hora exacta, descripción)
  detailPage: {
    enabled: false, // Deshabilitado por defecto (el listado tiene suficiente info)
    delayBetweenRequests: 500, // 500ms entre requests de detalles

    selectors: {
      // Fecha con hora: botón del picker muestra "10/12/2025 21:00"
      date: '#show-button strong',

      // Precio: hay múltiples tarifas, tomamos la primera (más barata)
      // Formato: "$ 42.000,00"
      price: '.rate .price',

      // Venue y address siempre son fijos
      venue: undefined,
      address: undefined,

      // Descripción del evento (si existe)
      description: '.event-description, .event-info, .container p',

      // Título e imagen
      title: 'h1',
      image: 'meta[property="og:image"]@content',

      // Categoría
      category: undefined,
    },

    defaultValues: {
      venue: 'Teatro Vorterix',
      city: 'Buenos Aires',
      country: 'AR',
      address: 'Av. Federico Lacroze 3455, C1427 CABA',
      category: 'Concierto',
    },

    transforms: {
      // Parsear fecha con hora: "10/12/2025 21:00" → Date
      date: 'parseSpanishDate', // Maneja formato DD/MM/YYYY HH:mm

      // Extraer precio: "$ 42.000,00" → 42000
      price: 'extractPrice',

      // Sanitizar descripción HTML
      description: 'sanitizeHtml',

      // URLs absolutas
      image: 'toAbsoluteUrl',

      // Limpiar título
      title: 'cleanWhitespace',
    },
  },
};

/**
 * NOTAS SOBRE TEATRO VORTERIX:
 *
 * 1. PLATAFORMA:
 *    - Usa Crowder/GetCrowder (mismo backend que AllAccess)
 *    - Estructura HTML consistente y predecible
 *    - Imágenes servidas desde cdn.getcrowder.com
 *
 * 2. FORMATO DE FECHAS:
 *    - Formato: "DD de Mes" o "DD de Mes YYYY"
 *    - Ejemplos: "29 de Noviembre", "12 de Diciembre 2025"
 *    - Algunos tienen &nbsp; en lugar de espacios: "21&nbsp;de Noviembre"
 *    - Transform parseSpanishDate maneja ambos formatos
 *
 * 3. LINKS:
 *    - URLs relativas: ../event/nombre-evento
 *    - Se convierten a absolutas con toAbsoluteUrl transform
 *
 * 4. CATEGORÍA:
 *    - Teatro Vorterix es principalmente venue de conciertos
 *    - Categoría por defecto: "Concierto"
 *    - Puede haber eventos de otros tipos (festivales, fiestas)
 *
 * 5. VENUE:
 *    - Siempre es "Teatro Vorterix"
 *    - Ubicación: Colegiales, Buenos Aires (CABA)
 *
 * 6. PAGINACIÓN:
 *    - No hay paginación visible
 *    - Todos los eventos se cargan en una sola página
 *
 * 7. DETAIL PAGE:
 *    - Deshabilitado por defecto (suficiente info en el listado)
 *    - Se puede habilitar si se necesita precio o descripción detallada
 *    - El sitio probablemente usa JSON-LD para datos estructurados
 *
 * 8. VALIDACIÓN:
 *    - Ejecutar: ts-node scripts/test-teatrovorterix.ts
 *    - Verificar que los selectores funcionan correctamente
 *    - Ajustar si el sitio cambia su estructura
 */
