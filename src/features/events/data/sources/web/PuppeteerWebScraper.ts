/**
 * Puppeteer Web Scraper
 *
 * Motor de scraping para sitios que requieren JavaScript (Blazor, React, Vue, etc.)
 * Usa Puppeteer para renderizar JavaScript y luego Cheerio para parsear HTML.
 * Implementa IDataSource para integrarse con DataSourceOrchestrator.
 *
 * IMPORTANTE: Solo usar para sitios que NO funcionan con GenericWebScraper.
 * Puppeteer es más lento y consume más recursos.
 */

import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import pLimit from 'p-limit';
import type { Browser, Page } from 'puppeteer';
import { IDataSource } from '@/features/events/domain/interfaces/IDataSource';
import { RawEvent } from '@/features/events/domain/entities/Event';
import { ScraperConfig, DEFAULT_SCRAPER_CONFIG } from './types/ScraperConfig';
import { applyTransform, cleanWhitespace, toAbsoluteUrl } from './utils/transforms';

// Import dinámico de Puppeteer (solo si se usa)
let puppeteer: typeof import('puppeteer') | null = null;
let browserInstance: import('puppeteer').Browser | null = null;

/**
 * Options para fetch (override de parámetros del config)
 */
export interface FetchOptions {
  /** Máximo número de páginas a scrapear */
  maxPages?: number;
  /** URL específica a scrapear (override de config.listing.url) */
  url?: string;
}

/**
 * Puppeteer Web Scraper - Scraper con soporte para JavaScript
 *
 * Usa Puppeteer para sitios que renderizan contenido con JavaScript.
 * Más lento que GenericWebScraper pero funciona con Blazor, React, Vue, etc.
 */
export class PuppeteerWebScraper implements IDataSource {
  readonly name: string;
  readonly type = 'web' as const;

  private readonly config: ScraperConfig;
  private readonly limiter: ReturnType<typeof pLimit>;

  constructor(config: ScraperConfig) {
    this.config = this.mergeWithDefaults(config);
    this.name = config.name;

    // Configurar rate limiter
    const requestsPerSecond = this.config.rateLimit?.requestsPerSecond || 1;
    const concurrency = Math.max(1, Math.floor(requestsPerSecond));
    this.limiter = pLimit(concurrency);
  }

  /**
   * Fetch eventos desde el sitio web usando Puppeteer
   */
  async fetch(options: FetchOptions = {}): Promise<RawEvent[]> {
    const events: RawEvent[] = [];
    const maxPages = options.maxPages || this.config.listing.pagination?.maxPages || 1;

    try {
      // Lazy load Puppeteer solo cuando se necesita
      if (!puppeteer) {
        console.log(`[${this.name}] Loading Puppeteer...`);
        puppeteer = await import('puppeteer');
      }

      // Iniciar navegador (singleton)
      const browser = await this.getBrowser();

      // Scrapear todas las páginas
      for (let page = 1; page <= maxPages; page++) {
        const url = this.buildPageUrl(page, options.url);

        try {
          const pageEvents = await this.scrapePage(browser, url);
          events.push(...pageEvents);

          // Delay entre páginas
          if (page < maxPages) {
            const delay = this.config.listing.pagination?.delayBetweenPages || 1000;
            await this.sleep(delay);
          }
        } catch (error: unknown) {
          // Manejar error de página
          if (this.config.errorHandling?.skipFailedPages) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.warn(`[${this.name}] Failed to scrape page ${page}: ${errorMessage}`);
            continue;
          } else {
            throw error;
          }
        }
      }

      return events;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to scrape ${this.name}: ${errorMessage}`);
    }
  }

  /**
   * Obtiene instancia del navegador (singleton)
   */
  private async getBrowser(): Promise<import('puppeteer').Browser> {
    if (!puppeteer) {
      throw new Error('Puppeteer not loaded');
    }

    if (!browserInstance || !browserInstance.connected) {
      console.log(`[${this.name}] Launching headless browser...`);
      browserInstance = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });

      // Cleanup on process exit
      process.on('exit', () => {
        if (browserInstance) {
          browserInstance.close().catch(console.error);
        }
      });
    }

    return browserInstance;
  }

  /**
   * Scrapea una página individual usando Puppeteer
   */
  private async scrapePage(browser: import('puppeteer').Browser, url: string): Promise<RawEvent[]> {
    const fullUrl = url.startsWith('http') ? url : `${this.config.baseUrl}${url}`;
    console.log(`[${this.name}] Scraping with Puppeteer: ${fullUrl}`);

    const page = await browser.newPage();

    try {
      // Configurar User-Agent y headers
      await page.setUserAgent(
        this.config.userAgent || DEFAULT_SCRAPER_CONFIG.userAgent || 'EnVivoBot/1.0'
      );

      if (this.config.headers) {
        await page.setExtraHTTPHeaders(this.config.headers);
      }

      // Navegar a la página
      const timeout = this.config.errorHandling?.timeout || 30000;
      await page.goto(fullUrl, {
        waitUntil: 'networkidle2', // Esperar a que red esté mayormente inactiva
        timeout,
      });

      // Esperar a que el selector específico aparezca (si está configurado)
      const waitForSelector = this.config.waitForSelector || this.config.listing.itemSelector;
      const waitForTimeout = this.config.waitForTimeout || 30000;

      console.log(`[${this.name}] Waiting for selector: ${waitForSelector}`);

      try {
        await page.waitForSelector(waitForSelector, { timeout: waitForTimeout });
        console.log(`[${this.name}] ✅ Selector found: ${waitForSelector}`);
      } catch {
        console.warn(
          `[${this.name}] ⚠️  Timeout waiting for ${waitForSelector}, continuing anyway...`
        );
        // Continuar de todos modos - puede que el selector sea incorrecto pero el contenido esté ahí
      }

      // Obtener HTML renderizado
      const html = await page.content();
      console.log(`[${this.name}] HTML length: ${html.length} bytes`);

      // Cerrar página
      await page.close();

      // Parsear con Cheerio (reutiliza toda la lógica de GenericWebScraper)
      const $ = cheerio.load(html);
      const events: RawEvent[] = [];
      const { containerSelector, itemSelector } = this.config.listing;

      // Seleccionar items (con o sin container)
      const $items = containerSelector ? $(containerSelector).find(itemSelector) : $(itemSelector);

      console.log(`[${this.name}] Found ${$items.length} items with selector: ${itemSelector}`);

      // Extraer datos de cada item
      const eventPromises: Promise<RawEvent | null>[] = [];

      $items.each((_, element) => {
        const $item = $(element);
        const promise = this.extractEventData($item, browser).catch((error: unknown) => {
          if (this.config.errorHandling?.skipFailedEvents) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.warn(`[${this.name}] Failed to extract event from item: ${errorMessage}`);
            return null;
          } else {
            throw error;
          }
        });
        eventPromises.push(promise);
      });

      // Esperar a que todos los eventos se procesen
      const extractedEvents = await Promise.all(eventPromises);

      // Filtrar nulls
      extractedEvents.forEach((event) => {
        if (event) {
          events.push(event);
        }
      });

      return events;
    } catch (error: unknown) {
      await page.close().catch(() => {});
      throw error;
    }
  }

  /**
   * Extrae datos de un evento individual (reutiliza lógica de GenericWebScraper)
   */
  private async extractEventData(
    $item: cheerio.Cheerio<AnyNode>,
    browser: Browser
  ): Promise<RawEvent | null> {
    const { selectors, transforms, defaultValues } = this.config;

    // Extraer todos los campos del listado
    const rawData: Record<string, string> = {};

    Object.entries(selectors).forEach(([field, selector]) => {
      if (!selector) {
        // Si no hay selector, usar valor por defecto si existe
        if (defaultValues && field in defaultValues) {
          const defaultValue = defaultValues[field as keyof typeof defaultValues];
          if (defaultValue) {
            rawData[field] = defaultValue;
          }
        }
        return;
      }

      let value: string | undefined;

      // Extraer valor según el tipo de selector
      if (selector.includes('@')) {
        // Atributo (ej: ".event-img@src", "a@href")
        const [cssSelector, attrName] = selector.split('@');
        value = $item.find(cssSelector).attr(attrName);
      } else {
        // Texto
        value = $item.find(selector).text().trim();
      }

      if (value) {
        rawData[field] = cleanWhitespace(value);
      } else if (defaultValues && field in defaultValues) {
        // Si no se encontró valor, usar default si existe
        const defaultValue = defaultValues[field as keyof typeof defaultValues];
        if (defaultValue) {
          rawData[field] = defaultValue;
        }
      }
    });

    // Aplicar transformaciones
    let transformedData: Record<string, unknown> = { ...rawData };

    if (transforms) {
      Object.entries(transforms).forEach(([field, transformName]) => {
        if (rawData[field] && transformName) {
          try {
            transformedData[field] = applyTransform(
              transformName,
              rawData[field],
              this.config.baseUrl
            );
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.warn(`[${this.name}] Failed to transform field ${field}: ${errorMessage}`);
          }
        }
      });
    }

    // Si detailPage está habilitado, scrapear detalles adicionales
    if (this.config.detailPage?.enabled && transformedData.link) {
      try {
        const detailUrl = toAbsoluteUrl(transformedData.link as string, this.config.baseUrl);
        console.log(`[${this.name}] 🔍 Scraping detail page: ${detailUrl}`);

        const detailData = await this.scrapeDetailPage(browser, detailUrl);
        console.log(`[${this.name}] ✅ Detail data scraped:`, {
          time: detailData.time,
          price: detailData.price,
          description: detailData.description
            ? `${(detailData.description as string).substring(0, 50)}...`
            : undefined,
        });

        // Mergear datos: detalles tienen prioridad sobre listado
        transformedData = { ...transformedData, ...detailData };

        // Si tenemos fecha y hora separadas, combinarlas
        if (transformedData.date instanceof Date && transformedData.time) {
          const timeStr = transformedData.time as string;
          const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);

          if (timeMatch) {
            const hours = parseInt(timeMatch[1], 10);
            const minutes = parseInt(timeMatch[2], 10);

            // IMPORTANTE: La hora viene de sitio argentino (UTC-3)
            // Convertir hora local Argentina a UTC: UTC = hora_local + 3
            // Ejemplo: 21:00 Argentina → 00:00 UTC del día siguiente
            const ARGENTINA_UTC_OFFSET = 3; // Argentina está UTC-3
            const utcHours = hours + ARGENTINA_UTC_OFFSET;

            // Crear fecha base en UTC (medianoche)
            const dateWithTime = new Date(transformedData.date);
            dateWithTime.setUTCHours(0, 0, 0, 0);

            // Agregar hora UTC (setUTCHours maneja automáticamente overflow al día siguiente)
            dateWithTime.setUTCHours(utcHours, minutes, 0, 0);

            transformedData.date = dateWithTime;
            console.log(
              `[${this.name}] ⏰ Combined date + time: ${hours}:${String(minutes).padStart(2, '0')} Argentina → ${dateWithTime.toISOString()}`
            );
          }
        }

        // Delay entre requests de detalles
        const delay = this.config.detailPage.delayBetweenRequests || 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn(
          `[${this.name}] ❌ Failed to scrape detail page for ${transformedData.link}: ${errorMessage}`
        );
        // Continuar con datos del listado solamente
      }
    }

    // Validar campos obligatorios
    if (!transformedData.title || !transformedData.date || !transformedData.venue) {
      console.warn(
        `[${this.name}] Skipping event with missing required fields: title=${transformedData.title}, date=${transformedData.date}, venue=${transformedData.venue}`
      );
      return null;
    }

    // Construir RawEvent
    const venue = transformedData.venue || defaultValues?.venue;

    return {
      _source: this.name,
      externalId: this.generateExternalId(rawData),
      title: transformedData.title as string,
      date: transformedData.date as Date,
      venue: venue as string,
      city: (transformedData.city as string) || defaultValues?.city,
      country: (transformedData.country as string) || defaultValues?.country,
      address: transformedData.address as string | undefined,
      price: transformedData.price as number | undefined,
      currency: transformedData.price !== undefined ? 'ARS' : undefined,
      category: (transformedData.category as string) || defaultValues?.category || 'Concierto',
      imageUrl: transformedData.image
        ? toAbsoluteUrl(transformedData.image as string, this.config.baseUrl)
        : undefined,
      externalUrl: transformedData.link
        ? toAbsoluteUrl(transformedData.link as string, this.config.baseUrl)
        : undefined,
      description: transformedData.description as string | undefined,
      ticketUrl: transformedData.link
        ? toAbsoluteUrl(transformedData.link as string, this.config.baseUrl)
        : undefined,
    };
  }

  /**
   * Genera external ID único para evento
   */
  private generateExternalId(data: Record<string, unknown>): string {
    // Usar link si existe, sino combinar title + date + venue
    if (data.link) {
      return data.link as string;
    }

    const date = data.date;
    const dateStr = date instanceof Date ? date.toISOString() : String(date);

    const parts = [data.title, dateStr, data.venue].filter(Boolean).join('_');

    return parts
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .substring(0, 100);
  }

  /**
   * Scrapea la página de detalles de un evento usando Puppeteer
   */
  private async scrapeDetailPage(browser: Browser, url: string): Promise<Record<string, unknown>> {
    if (!this.config.detailPage) {
      return {};
    }

    const navTimeout = this.config.detailPage.timeout || 30000;
    const maxRenderRetries = this.config.detailPage.maxRenderRetries ?? 0;

    // Crear nueva página
    const page = await browser.newPage();

    try {
      let lastData: Record<string, unknown> = {};

      // Bucle de reintentos: sitios Blazor Server entregan el contenido por WebSocket
      // de forma intermitente. Si la zona crítica (ej: tarjeta de precio) no renderiza,
      // recargamos en vez de quedarnos con datos incompletos.
      for (let attempt = 0; attempt <= maxRenderRetries; attempt++) {
        // Navegar (primer intento) o recargar (reintentos)
        // Usar 'networkidle2' para esperar que Blazor renderice contenido vía SignalR
        // Navegar/extraer dentro de try: Blazor puede desconectar el frame durante el
        // render (navegación SignalR → "detached Frame"). En ese caso tratamos el intento
        // como fallido y reintentamos en vez de abortar todo el scrape del detalle.
        let data: Record<string, unknown>;
        let criticalRendered: boolean;
        try {
          if (attempt === 0) {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: navTimeout });
          } else {
            console.warn(
              `[${this.name}]   🔄 Reintento ${attempt}/${maxRenderRetries}: recargando (render incompleto)...`
            );
            await page.reload({ waitUntil: 'networkidle2', timeout: navTimeout });
          }

          ({ data, criticalRendered } = await this.renderAndExtractDetail(page));
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.warn(`[${this.name}]   ⚠️  Intento ${attempt} falló: ${errorMessage}`);
          continue;
        }
        lastData = data;

        const hasPrice = typeof data.price === 'number';

        // Éxito: ya tenemos precio
        if (hasPrice) {
          return data;
        }

        // La zona de compra renderizó pero sin precio → sin precio publicado
        // (agotado / próximamente / venta externa). No tiene sentido reintentar.
        if (criticalRendered) {
          console.log(
            `[${this.name}]   ℹ️  Sin precio publicado (zona de compra renderizó sin precio)`
          );
          return data;
        }

        // Render incompleto y aún quedan reintentos → el bucle recargará
      }

      console.warn(
        `[${this.name}]   ❌ Precio no obtenido tras ${maxRenderRetries + 1} intento(s) (render incompleto)`
      );
      return lastData;
    } finally {
      // Siempre cerrar la página
      await page.close();
    }
  }

  /**
   * Espera el render de Blazor en la página de detalle y extrae los campos configurados.
   *
   * @returns data extraída y `criticalRendered`: si la zona crítica (criticalSelector)
   *          apareció con contenido. Se usa para decidir si reintentar.
   */
  private async renderAndExtractDetail(
    page: Page
  ): Promise<{ data: Record<string, unknown>; criticalRendered: boolean }> {
    if (!this.config.detailPage) {
      return { data: {}, criticalRendered: false };
    }

    const { selectors, transforms, defaultValues } = this.config.detailPage;

    {
      // CRÍTICO para Blazor: Delay fijo para que Blazor Server inicialice SignalR/WebSocket
      const blazorInitDelay = 5000; // 5 segundos para inicialización de Blazor
      console.log(`[${this.name}]   Waiting ${blazorInitDelay}ms for Blazor initialization...`);
      await new Promise((resolve) => setTimeout(resolve, blazorInitDelay));

      // Esperar a que el selector específico aparezca (detailPage)
      const detailWaitSelector = this.config.detailPage.waitForSelector || '.evento-titulo';
      const detailWaitTimeout = this.config.detailPage.waitForTimeout || 45000; // Aumentado a 45s

      console.log(`[${this.name}]   Waiting for detail selector: ${detailWaitSelector}`);

      try {
        await page.waitForSelector(detailWaitSelector, { timeout: detailWaitTimeout });
        console.log(`[${this.name}]   ✅ Detail selector found: ${detailWaitSelector}`);
      } catch {
        // Si falla, intentar un delay adicional por si Blazor es muy lento
        console.warn(
          `[${this.name}]   ⚠️  Timeout waiting for ${detailWaitSelector}, retrying with additional delay...`
        );
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Verificar si ahora el selector está presente
        const html = await page.content();
        console.log(`[${this.name}]   HTML length after retry: ${html.length} bytes`);

        if (html.length < 20000) {
          console.warn(
            `[${this.name}]   ❌ Blazor did not load (HTML too small: ${html.length} bytes)`
          );
        }
      }

      // CRÍTICO: Esperar tiempo adicional si está configurado (para que Blazor termine de renderizar TODO)
      // Esto es necesario porque Blazor puede cargar el título primero y la descripción después
      const additionalWaitTime = this.config.detailPage.additionalWaitTime;
      if (additionalWaitTime) {
        console.log(
          `[${this.name}]   ⏳ Waiting additional ${additionalWaitTime}ms for Blazor content...`
        );
        await new Promise((resolve) => setTimeout(resolve, additionalWaitTime));
        console.log(`[${this.name}]   ✅ Additional wait completed`);
      }

      // Esperar a que la "zona crítica" (ej: tarjeta de precio) aparezca CON contenido.
      // En Blazor Server el título puede renderizar antes que el precio; sin esto leeríamos
      // el DOM demasiado pronto. `criticalRendered` distingue "render incompleto" de
      // "sin precio publicado" para el bucle de reintentos en scrapeDetailPage().
      let criticalRendered = true;
      const criticalSelector = this.config.detailPage.criticalSelector;
      if (criticalSelector) {
        const criticalTimeout = this.config.detailPage.waitForTimeout || 30000;
        console.log(`[${this.name}]   Waiting for critical zone: ${criticalSelector}`);
        try {
          await page.waitForFunction(
            (sel: string) => {
              const el = document.querySelector(sel);
              return !!el && (el.textContent || '').trim().length > 0;
            },
            { timeout: criticalTimeout, polling: 500 },
            criticalSelector
          );
          console.log(`[${this.name}]   ✅ Critical zone rendered: ${criticalSelector}`);
        } catch {
          criticalRendered = false;
          console.warn(`[${this.name}]   ⚠️  Critical zone never rendered: ${criticalSelector}`);
        }
      }

      // Obtener HTML renderizado
      const html = await page.content();
      console.log(`[${this.name}]   HTML length: ${html.length} bytes`);

      // Parsear con Cheerio (reutiliza toda la lógica)
      const $ = cheerio.load(html);

      const rawData: Record<string, string> = {};

      // Extraer campos usando selectores de detailPage
      console.log(`[${this.name}]   Testing ${Object.keys(selectors).length} selectors...`);
      Object.entries(selectors).forEach(([field, selector]) => {
        if (!selector) {
          // Si no hay selector, usar valor por defecto si existe
          if (defaultValues && field in defaultValues) {
            const defaultValue = defaultValues[field as keyof typeof defaultValues];
            if (defaultValue) {
              rawData[field] = defaultValue;
            }
          }
          return;
        }

        let value: string | undefined;

        // Extraer valor según el tipo de selector
        if (selector.includes('@')) {
          // Atributo (ej: ".event-img@src", "a@href")
          const [cssSelector, attrName] = selector.split('@');
          value = $(cssSelector).attr(attrName);
        } else {
          // Texto
          // CASO ESPECIAL: Para precio, remover iframes y scripts antes de buscar
          if (field === 'price') {
            // Debug: verificar si el selector existe
            const elementCount = $(selector).length;
            console.log(
              `[${this.name}]   🔍 DEBUG price - selector: "${selector}", elements found: ${elementCount}`
            );

            if (elementCount > 0) {
              // Clonar el selector para no modificar el DOM original
              const $clone = $(selector).clone();

              // Debug: texto antes de remover iframes/scripts
              const textBefore = $clone.text().trim().substring(0, 100);
              console.log(`[${this.name}]   🔍 DEBUG price - text before cleanup: "${textBefore}"`);

              // Remover iframes, scripts, noscript, style (puede haber en cualquier contenedor)
              $clone.find('iframe, script, noscript, style').remove();
              value = $clone.text().trim();

              // Debug: texto después de cleanup
              console.log(
                `[${this.name}]   🔍 DEBUG price - text after cleanup: "${value.substring(0, 100)}"`
              );
            } else {
              console.log(
                `[${this.name}]   ❌ DEBUG price - selector "${selector}" not found in HTML`
              );
            }
          } else {
            // Manejar selectores que devuelven múltiples elementos (ej: descripción con múltiples <p>)
            const elements = $(selector);
            if (elements.length > 1) {
              // Multi-elemento: extraer cada uno y unir con \n\n
              value = elements
                .map((i, el) => $(el).text().trim())
                .get()
                .join('\n\n');
            } else {
              // Single-elemento: comportamiento actual
              value = $(selector).text().trim();
            }
          }
        }

        if (value) {
          rawData[field] = cleanWhitespace(value);
          console.log(
            `[${this.name}]   ✅ ${field}: "${value.substring(0, 60)}${value.length > 60 ? '...' : ''}"`
          );
        } else {
          console.log(`[${this.name}]   ❌ ${field}: NOT found with selector "${selector}"`);

          if (defaultValues && field in defaultValues) {
            // Si no se encontró valor, usar default si existe
            const defaultValue = defaultValues[field as keyof typeof defaultValues];
            if (defaultValue) {
              rawData[field] = defaultValue;
            }
          }
        }
      });

      // Aplicar transformaciones específicas de detailPage
      const transformedData: Record<string, unknown> = { ...rawData };

      if (transforms) {
        Object.entries(transforms).forEach(([field, transformName]) => {
          if (rawData[field] && transformName) {
            try {
              // Debug especial para precio
              if (field === 'price') {
                console.log(
                  `[${this.name}]   🔍 DEBUG transform - applying "${transformName}" to price text (full):`
                );
                console.log(`[${this.name}]      Input text: "${rawData[field]}"`);
              }

              transformedData[field] = applyTransform(
                transformName,
                rawData[field],
                this.config.baseUrl
              );

              // Debug resultado del transform para precio y description
              if (field === 'price') {
                console.log(`[${this.name}]      Transform result: ${transformedData[field]}`);
              }
            } catch (error: unknown) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              console.warn(
                `[${this.name}] Failed to transform detail field ${field}: ${errorMessage}`
              );
            }
          }
        });
      }

      return { data: transformedData, criticalRendered };
    }
  }

  /**
   * Construir URL de página (con paginación)
   */
  private buildPageUrl(page: number, overrideUrl?: string): string {
    const baseListingUrl = overrideUrl || this.config.listing.url;

    // Sin paginación o primera página
    if (!this.config.listing.pagination || page === 1) {
      return baseListingUrl;
    }

    const { type, pattern } = this.config.listing.pagination;

    if (type === 'url' && pattern) {
      // URL pattern (ej: "/events/page/{page}")
      return pattern.replace('{page}', page.toString());
    }

    // Default: agregar ?page=N
    const separator = baseListingUrl.includes('?') ? '&' : '?';
    return `${baseListingUrl}${separator}page=${page}`;
  }

  /**
   * Merge config con defaults
   */
  private mergeWithDefaults(config: ScraperConfig): ScraperConfig {
    return {
      ...config,
      rateLimit: config.rateLimit || DEFAULT_SCRAPER_CONFIG.rateLimit,
      errorHandling: {
        skipFailedEvents:
          config.errorHandling?.skipFailedEvents ??
          DEFAULT_SCRAPER_CONFIG.errorHandling?.skipFailedEvents ??
          true,
        skipFailedPages:
          config.errorHandling?.skipFailedPages ??
          DEFAULT_SCRAPER_CONFIG.errorHandling?.skipFailedPages ??
          false,
        timeout:
          config.errorHandling?.timeout ?? DEFAULT_SCRAPER_CONFIG.errorHandling?.timeout ?? 30000,
        retry: config.errorHandling?.retry || DEFAULT_SCRAPER_CONFIG.errorHandling?.retry,
      },
    };
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Cleanup - cierra el navegador
   */
  static async cleanup(): Promise<void> {
    if (browserInstance) {
      console.log('[PuppeteerWebScraper] Closing browser...');
      await browserInstance.close();
      browserInstance = null;
    }
  }
}
