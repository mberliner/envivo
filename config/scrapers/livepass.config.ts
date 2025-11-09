/**
 * LivePass.com.ar Scraper Configuration
 *
 * NOTA: Los selectores CSS son PLACEHOLDER y deben ajustarse
 * después de inspeccionar el HTML real del sitio.
 *
 * Para encontrar los selectores correctos:
 * 1. Abrir https://livepass.com.ar/taxons/cafe-berlin en navegador
 * 2. Click derecho → Inspeccionar elemento
 * 3. Encontrar el HTML de un evento en el listado
 * 4. Identificar clases CSS únicas para cada campo
 * 5. Actualizar los selectores abajo
 *
 * Ejemplo:
 * Si el HTML es:
 *   <div class="event-card">
 *     <h3 class="event-title">Metallica en vivo</h3>
 *     <span class="event-date">15 de marzo 2025</span>
 *   </div>
 *
 * Los selectores serían:
 *   itemSelector: '.event-card'
 *   title: '.event-title'
 *   date: '.event-date'
 */

import { ScraperConfig } from '@/features/events/data/sources/web/types/ScraperConfig';

export const livepassConfig: ScraperConfig = {
  name: 'livepass',
  type: 'web',
  baseUrl: 'https://livepass.com.ar',

  listing: {
    // URL del listado de eventos
    url: '/taxons/cafe-berlin',

    // Selector del contenedor principal (opcional)
    // Buscar un <div> o <section> que contenga todos los eventos
    containerSelector: '.events-container', // 🔴 PLACEHOLDER - ajustar después de inspección

    // Selector de cada evento individual
    // Buscar el elemento que se repite por cada evento
    itemSelector: '.event-card', // 🔴 PLACEHOLDER - ajustar después de inspección

    // Configuración de paginación
    pagination: {
      type: 'url',
      // Patrón si usan /page/2, /page/3, etc.
      pattern: '/taxons/cafe-berlin?page={page}', // 🔴 PLACEHOLDER - verificar
      maxPages: 3, // Scrapear hasta 3 páginas
      delayBetweenPages: 1500, // 1.5 segundos entre páginas
    },
  },

  selectors: {
    // 🔴 TODOS LOS SELECTORES SON PLACEHOLDERS
    // Ajustar después de inspeccionar el HTML real

    title: '.event-title', // Selector del título del evento
    date: '.event-date', // Selector de la fecha
    venue: '.event-venue', // Selector del venue/lugar
    city: '.event-city', // Selector de la ciudad (si existe)
    address: '.event-address', // Selector de la dirección (si existe)
    price: '.event-price', // Selector del precio
    image: '.event-image img@src', // Selector de imagen (atributo src)
    link: '.event-link@href', // Selector del link (atributo href)
    category: '.event-category', // Selector de categoría/género
    description: '.event-description', // Selector de descripción
  },

  transforms: {
    // Transformaciones a aplicar a los campos extraídos
    date: 'parseSpanishDate', // Parsear fecha en español
    price: 'extractPrice', // Extraer precio numérico
    description: 'sanitizeHtml', // Limpiar HTML
    image: 'toAbsoluteUrl', // Convertir a URL absoluta
    link: 'toAbsoluteUrl', // Convertir a URL absoluta
  },

  rateLimit: {
    requestsPerSecond: 1, // 1 request por segundo (conservador)
    timeout: 15000, // 15 segundos timeout
  },

  errorHandling: {
    skipFailedEvents: true, // Continuar si un evento falla
    skipFailedPages: false, // Fallar si una página completa falla
    retry: {
      maxRetries: 3,
      initialDelay: 1000,
      backoffMultiplier: 2,
    },
    timeout: 15000,
  },

  userAgent: 'EnVivoBot/1.0 (+https://envivo.ar/bot)',

  headers: {
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
  },
};

/**
 * INSTRUCCIONES PARA ACTUALIZAR SELECTORES:
 *
 * 1. Inspeccionar HTML del sitio:
 *    - Abrir https://livepass.com.ar/taxons/cafe-berlin
 *    - F12 para abrir DevTools
 *    - Tab "Elements" o "Inspector"
 *
 * 2. Encontrar el contenedor de eventos:
 *    - Buscar un elemento que contenga TODOS los eventos
 *    - Puede ser <div class="eventos">, <section>, etc.
 *    - Copiar el class name → actualizar `containerSelector`
 *
 * 3. Encontrar el selector de cada evento:
 *    - Buscar el elemento que se REPITE por cada evento
 *    - Puede ser <div class="event-card">, <article>, etc.
 *    - Copiar el class name → actualizar `itemSelector`
 *
 * 4. Encontrar selectores de campos:
 *    - Dentro de un evento, buscar el título
 *    - Copiar el class → actualizar `selectors.title`
 *    - Repetir para fecha, venue, precio, etc.
 *
 * 5. Para atributos (imagen, link):
 *    - Si es una imagen: '.class-name img@src'
 *    - Si es un link: '.class-name a@href'
 *    - El @src o @href indica que queremos el atributo, no el texto
 *
 * 6. Probar con tests:
 *    - Crear un fixture HTML de ejemplo
 *    - Ejecutar tests para verificar que se extraigan correctamente
 *
 * EJEMPLO DE HTML TÍPICO:
 *
 * <div class="events-list">
 *   <div class="event-card">
 *     <img src="/images/evento1.jpg" class="event-img" />
 *     <h3 class="event-title">Metallica en vivo</h3>
 *     <p class="event-date">Viernes 15 de marzo, 21:00hs</p>
 *     <p class="event-venue">Café Berlín</p>
 *     <p class="event-location">Palermo, Buenos Aires</p>
 *     <span class="event-price">$5.000</span>
 *     <a href="/eventos/metallica-123" class="event-link">Ver más</a>
 *   </div>
 *   ... más eventos ...
 * </div>
 *
 * Para este HTML, los selectores serían:
 *   containerSelector: '.events-list'
 *   itemSelector: '.event-card'
 *   title: '.event-title'
 *   date: '.event-date'
 *   venue: '.event-venue'
 *   city: '.event-location'  (y extraer solo "Buenos Aires")
 *   price: '.event-price'
 *   image: '.event-img@src'
 *   link: '.event-link@href'
 */
