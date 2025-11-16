/**
 * Movistar Arena Scraper Configuration
 *
 * Configuración para scraping de eventos del Movistar Arena
 * https://www.movistararena.com.ar/shows
 *
 * Actualizado: Noviembre 2025
 */

import { ScraperConfig } from '@/features/events/data/sources/web/types/ScraperConfig';

export const movistarArenaConfig: ScraperConfig = {
  name: 'movistararena',
  type: 'web',
  baseUrl: 'https://www.movistararena.com.ar',

  // CRÍTICO: Este sitio usa Blazor (JavaScript rendering)
  // Requiere Puppeteer en lugar de Cheerio
  requiresJavaScript: true,
  waitForSelector: '.evento', // Esperar a que los eventos se carguen
  waitForTimeout: 30000, // 30 segundos máximo

  listing: {
    // URL de eventos
    url: '/shows',

    // No hay contenedor específico - los eventos están directamente en el DOM
    containerSelector: undefined,

    // Cada evento es un div.evento
    itemSelector: '.evento',

    // No hay paginación (todos los eventos en una página)
    pagination: {
      type: 'none',
    },
  },

  selectors: {
    // Título: <h5>BILLY IDOL</h5>
    title: 'h5',

    // Fecha: <span>15 noviembre 2025</span> o <span>20 noviembre 2025 y 2 fechas más</span>
    date: '.descripcion span',

    // Imagen: background-image en el atributo style de .box-img
    // Necesita transform extractBackgroundImage
    image: '.box-img@style',

    // Link: href del primer <a> dentro de .box-img o .acciones
    // Usamos .box-img a porque aparece primero
    link: '.box-img a@href',

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
    venue: 'Movistar Arena',
    city: 'Buenos Aires',
    country: 'AR',
    address: 'Humboldt 450, C1414CTL CABA',
    category: 'Concierto',
  },

  transforms: {
    // Parsear fecha: "15 noviembre 2025" o "20 noviembre 2025 y 2 fechas más"
    date: 'parseMovistarDate',

    // Extraer URL de background-image: url('...')
    image: 'extractBackgroundImage',

    // Convertir URLs relativas a absolutas
    link: 'toAbsoluteUrl',

    // Limpiar título (normalizar espacios)
    title: 'cleanWhitespace',
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
  // HABILITADO para obtener hora, descripción y precio
  detailPage: {
    enabled: true,
    delayBetweenRequests: 1000, // 1 segundo entre requests de detalles

    selectors: {
      // Título completo del evento
      title: '.evento-titulo',

      // Descripción del evento (div.descripcion para ser más específico)
      description: 'div.descripcion',

      // Hora del show (segundo elemento .hora contiene la hora del show)
      time: '.hora:nth-of-type(2)', // "21:00 hs Show"

      // Precio: buscar en section o main content para evitar precios del footer/menu
      price: 'main, section, .content, body', // Buscar en contenido principal primero

      // Campos que no cambian (usar defaults)
      venue: undefined,
      address: undefined,
      category: undefined,
      city: undefined,
      country: undefined,
    },

    defaultValues: {
      venue: 'Movistar Arena',
      city: 'Buenos Aires',
      country: 'AR',
      address: 'Humboldt 450, C1414CTL CABA',
      category: 'Concierto',
    },

    transforms: {
      title: 'cleanWhitespace',
      description: 'sanitizeHtml',
      time: 'extractMovistarTime', // Extraer "21:00" de "21:00 hs Show"
      price: 'extractMovistarPrice', // Extraer "$ 60.000" del texto
    },
  },
};

/**
 * NOTAS SOBRE MOVISTAR ARENA:
 *
 * 0. IMPORTANTE - BLAZOR SERVER:
 *    - El sitio usa Blazor Server (framework .NET)
 *    - El contenido se carga DINÁMICAMENTE vía JavaScript/WebSocket
 *    - REQUIERE Puppeteer (navegador headless) para renderizar
 *    - NO funciona con Cheerio (HTML estático)
 *    - El scraper automáticamente usa PuppeteerWebScraper cuando detecta requiresJavaScript: true
 *
 * 1. FORMATO DE FECHA:
 *    - Formato: "15 noviembre 2025" (día + mes + año)
 *    - Algunos eventos tienen múltiples fechas: "20 noviembre 2025 y 2 fechas más"
 *    - Solución: Transform parseMovistarDate limpia " y X fechas más" antes de parsear
 *
 * 2. IMAGEN:
 *    - La imagen viene como inline style: background-image: url('...')
 *    - Solución: Transform extractBackgroundImage extrae la URL del estilo
 *
 * 3. VENUE:
 *    - Todos los eventos son en Movistar Arena
 *    - Hardcodeado en defaultValues
 *
 * 4. PRECIO:
 *    - NO se muestra en el listado
 *    - Requeriría scraping de página de detalle (actualmente deshabilitado)
 *
 * 5. PAGINACIÓN:
 *    - Todos los eventos se cargan en una sola página
 *    - No hay links de "siguiente página"
 *
 * 6. CIUDAD Y DIRECCIÓN:
 *    - Todos los eventos son en Buenos Aires
 *    - Dirección: Humboldt 450, C1414CTL CABA
 *    - Hardcodeado en defaultValues
 *
 * 7. CATEGORÍA:
 *    - Todos los eventos son conciertos musicales
 *    - Hardcodeado como "Concierto"
 *
 * 8. EVENTOS CON MÚLTIPLES FECHAS:
 *    - Algunos eventos tienen "y X fechas más" en el texto de fecha
 *    - Actualmente solo se scrapea la primera fecha
 *    - TODO: Si se necesita, scrapear página de detalle para obtener todas las fechas
 */
