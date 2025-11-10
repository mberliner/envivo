/**
 * LivePass.com.ar Scraper Configuration
 *
 * Configuración REAL basada en inspección del HTML de:
 * https://livepass.com.ar/taxons/cafe-berlin
 *
 * Actualizado: 9 de Noviembre 2025
 */

import { ScraperConfig } from '@/features/events/data/sources/web/types/ScraperConfig';

export const livepassConfig: ScraperConfig = {
  name: 'livepass',
  type: 'web',
  baseUrl: 'https://livepass.com.ar',

  listing: {
    url: '/taxons/cafe-berlin',

    // Contenedor principal (opcional - mejora performance)
    containerSelector: '.row.grid',

    // Cada evento está en un div.event-box
    itemSelector: '.event-box',

    // LivePass NO tiene paginación visible en el listado de Café Berlín
    // Todos los eventos se cargan en una sola página
    pagination: {
      type: 'none',
    },
  },

  selectors: {
    // Título está en <h1 class="m-y-0">Santiago Molina en Café Berlín</h1>
    // NOTA: Incluye " en Café Berlín" que debemos limpiar
    title: 'h1.m-y-0',

    // Fecha está en <p class="date-home">09 NOV</p>
    // Formato: "DD MMM" (ej: "09 NOV", "21 DIC")
    date: '.date-home',

    // Imagen: <img src="..." class="img-home-count">
    image: 'img.img-home-count@src',

    // Link: <a href="/events/...">
    link: 'a@href',

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
    venue: 'Café Berlín',
    city: 'Buenos Aires',
    country: 'AR',
    category: 'Concierto',
  },

  transforms: {
    // Transformación especial para formato LivePass: "09 NOV" → Date
    date: 'parseLivepassDate',

    // Convertir URLs relativas a absolutas
    image: 'toAbsoluteUrl',
    link: 'toAbsoluteUrl',

    // Limpiar título: "Santiago Molina en Café Berlín" → "Santiago Molina"
    title: 'cleanLivepassTitle',
  },

  rateLimit: {
    requestsPerSecond: 1, // Conservador
    timeout: 15000,
  },

  errorHandling: {
    skipFailedEvents: true, // Continuar si un evento falla
    skipFailedPages: false,
    retry: {
      maxRetries: 3,
      initialDelay: 1000,
      backoffMultiplier: 2,
    },
    timeout: 15000,
  },

  userAgent: 'EnVivoBot/1.0 (+https://envivo.ar/bot)',

  headers: {
    Accept: 'text/html,application/xhtml+xml',
    'Accept-Language': 'es-AR,es;q=0.9',
  },
};

/**
 * NOTAS SOBRE LIVEPASS:
 *
 * 1. FECHA:
 *    - Formato: "09 NOV", "21 DIC" (día + mes abreviado)
 *    - Sin año explícito
 *    - Solución: Asumir año actual (2025)
 *
 * 2. VENUE:
 *    - NO hay selector separado
 *    - El título incluye "... en Café Berlín"
 *    - Solución: Hardcodear "Café Berlín" en el scraper
 *
 * 3. PRECIO:
 *    - NO se muestra en el listado
 *    - Solo aparece al hacer click en el evento
 *    - Solución: Omitir (campo opcional en RawEvent)
 *
 * 4. PAGINACIÓN:
 *    - Todos los eventos se cargan en una sola página
 *    - No hay links de "siguiente página"
 *
 * 5. CIUDAD:
 *    - Todos los eventos son en Buenos Aires
 *    - Hardcodeado en el scraper
 */
