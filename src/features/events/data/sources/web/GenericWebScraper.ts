/**
 * Generic Web Scraper
 *
 * Motor de scraping configurable que usa Cheerio para parsear HTML.
 * Implementa IDataSource para integrarse con DataSourceOrchestrator.
 */

import axios, { AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import pLimit from 'p-limit';
import pRetry from 'p-retry';
import { IDataSource } from '@/features/events/domain/interfaces/IDataSource';
import { RawEvent } from '@/features/events/domain/entities/Event';
import { ScraperConfig, DEFAULT_SCRAPER_CONFIG } from './types/ScraperConfig';
import {
  applyTransform,
  cleanWhitespace,
  extractMovistarPrice,
  toAbsoluteUrl,
} from './utils/transforms';

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
 * Generic Web Scraper - Configurable HTML scraper
 *
 * Usa configuración para extraer eventos de sitios web.
 * Soporta paginación, transformaciones, rate limiting y retry.
 */
export class GenericWebScraper implements IDataSource {
  readonly name: string;
  readonly type = 'web' as const;

  private readonly config: ScraperConfig;
  private readonly httpClient: AxiosInstance;
  private readonly limiter: ReturnType<typeof pLimit>;

  constructor(config: ScraperConfig) {
    this.config = this.mergeWithDefaults(config);
    this.name = config.name;

    // Configurar HTTP client
    this.httpClient = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.errorHandling?.timeout || 15000,
      headers: {
        'User-Agent': this.config.userAgent || DEFAULT_SCRAPER_CONFIG.userAgent,
        ...this.config.headers,
      },
    });

    // Configurar rate limiter
    const requestsPerSecond = this.config.rateLimit?.requestsPerSecond || 1;
    const concurrency = Math.max(1, Math.floor(requestsPerSecond));
    this.limiter = pLimit(concurrency);
  }

  /**
   * Fetch eventos desde el sitio web
   */
  async fetch(options: FetchOptions = {}): Promise<RawEvent[]> {
    const events: RawEvent[] = [];
    const maxPages = options.maxPages || this.config.listing.pagination?.maxPages || 1;

    try {
      // Scrapear todas las páginas
      for (let page = 1; page <= maxPages; page++) {
        const url = this.buildPageUrl(page, options.url);

        try {
          const pageEvents = await this.scrapePage(url);
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
   * Scrapea una página individual
   */
  private async scrapePage(url: string): Promise<RawEvent[]> {
    const html = await this.fetchWithRetry(url);
    const $ = cheerio.load(html);

    const events: RawEvent[] = [];
    const { containerSelector, itemSelector } = this.config.listing;

    // Seleccionar items (con o sin container)
    const $items = containerSelector ? $(containerSelector).find(itemSelector) : $(itemSelector);

    // Extraer datos de cada item (ahora async)
    const eventPromises: Promise<RawEvent | null>[] = [];

    $items.each((_, element) => {
      const $item = $(element);
      const promise = this.extractEventData($item).catch((error: unknown) => {
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
  }

  /**
   * Extrae datos de un evento individual (desde el listado)
   */
  private async extractEventData(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $item: cheerio.Cheerio<any>
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
        // Atributo (ej: ".event-img@src", "a@href", "self@href")
        const [cssSelector, attrName] = selector.split('@');

        if (cssSelector === 'self' || cssSelector === '') {
          // Atributo del elemento actual (self@href o @href)
          value = $item.attr(attrName);
        } else {
          // Atributo de un elemento hijo (.event-img@src)
          value = $item.find(cssSelector).attr(attrName);
        }
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

    // Aplicar transformaciones (solo a campos extraídos, no a defaults)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let transformedData: Record<string, any> = { ...rawData };

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
        const detailUrl = toAbsoluteUrl(transformedData.link, this.config.baseUrl);
        console.log(`[${this.name}] 🔍 Scraping detail page: ${detailUrl}`);

        const detailData = await this.scrapeDetailPage(detailUrl);
        console.log(`[${this.name}] ✅ Detail data scraped:`, {
          date: detailData.date,
          venue: detailData.venue,
          address: detailData.address,
          price: detailData.price,
          priceMax: detailData.priceMax,
          description: detailData.description
            ? `${(detailData.description as string).substring(0, 50)}...`
            : undefined,
        });

        // Mergear datos: detalles tienen prioridad sobre listado
        transformedData = { ...transformedData, ...detailData };

        // Delay entre requests de detalles
        const delay = this.config.detailPage.delayBetweenRequests || 500;
        await this.sleep(delay);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn(
          `[${this.name}] ❌ Failed to scrape detail page for ${transformedData.link}: ${errorMessage}`
        );
        // Continuar con datos del listado solamente
      }
    } else {
      // Debug: por qué no se está scrapeando la página de detalles?
      if (!this.config.detailPage?.enabled) {
        console.log(`[${this.name}] ⚠️  Detail page scraping is DISABLED`);
      }
      if (!transformedData.link) {
        console.log(`[${this.name}] ⚠️  No link found for event: ${transformedData.title}`);
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
    console.log(
      `[${this.name}] 🏛️  Building RawEvent: venue="${venue}" (transformed="${transformedData.venue}", default="${defaultValues?.venue}")`
    );

    return {
      _source: this.name, // Using _source to match ExternalApiMapper pattern
      externalId: this.generateExternalId(rawData), // Use raw data for ID (before transformation)
      title: transformedData.title,
      date: transformedData.date,
      venue: venue,
      city: transformedData.city || defaultValues?.city,
      country: transformedData.country || defaultValues?.country,
      address: transformedData.address,
      price: transformedData.price,
      currency: transformedData.price !== undefined ? 'ARS' : undefined,
      category: transformedData.category || defaultValues?.category || 'Concierto',
      imageUrl: transformedData.image
        ? toAbsoluteUrl(transformedData.image, this.config.baseUrl)
        : undefined,
      externalUrl: transformedData.link
        ? toAbsoluteUrl(transformedData.link, this.config.baseUrl)
        : undefined,
      description: transformedData.description,
      priceMax: transformedData.priceMax,
      ticketUrl: transformedData.link
        ? toAbsoluteUrl(transformedData.link, this.config.baseUrl)
        : undefined,
    };
  }

  /**
   * Extrae JSON-LD (schema.org) de una página HTML
   */
  private extractJsonLd(html: string): Record<string, unknown> | null {
    // Buscar script tag con type="application/ld+json"
    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);

    if (!match || !match[1]) {
      return null;
    }

    try {
      const jsonString = match[1].trim();
      const data = JSON.parse(jsonString) as Record<string, unknown>;

      // Validar que sea un Event
      if (data['@type'] !== 'Event') {
        return null;
      }

      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`[${this.name}] Failed to parse JSON-LD: ${errorMessage}`);
      return null;
    }
  }

  /**
   * Parsea JSON-LD de schema.org Event a formato EventData
   */
  private parseJsonLdToEventData(jsonLd: Record<string, unknown>): Record<string, unknown> {
    const detailData: Record<string, unknown> = {};

    // Extraer fecha/hora
    if (typeof jsonLd.startDate === 'string') {
      detailData.date = new Date(jsonLd.startDate);
    }

    // Extraer precio (mínimo y máximo de offers)
    // Soporta: array de offers, objeto único, Offer (price) y AggregateOffer (lowPrice / highPrice)
    const offersRaw = jsonLd.offers;
    if (offersRaw) {
      const offersArray = Array.isArray(offersRaw) ? offersRaw : [offersRaw];
      const offers = offersArray as Array<{
        price?: number | string;
        lowPrice?: number | string;
        highPrice?: number | string;
      }>;
      const prices: number[] = [];

      offers.forEach((offer) => {
        const candidates = [offer.price, offer.lowPrice, offer.highPrice];
        candidates.forEach((candidate) => {
          const parsed =
            typeof candidate === 'number'
              ? candidate
              : typeof candidate === 'string'
                ? parseFloat(candidate)
                : NaN;
          if (!isNaN(parsed) && parsed > 0) {
            prices.push(parsed);
          }
        });
      });

      if (prices.length > 0) {
        detailData.price = Math.min(...prices);
        detailData.priceMax = Math.max(...prices);
      }
    }

    // Extraer venue
    const location = jsonLd.location as
      | {
          name?: string;
          address?: { streetAddress?: string; addressLocality?: string; postalCode?: string };
        }
      | undefined;

    if (location?.name) {
      detailData.venue = location.name;
    }

    // Extraer dirección
    if (location?.address) {
      const addr = location.address;
      const parts = [addr.streetAddress, addr.addressLocality, addr.postalCode].filter(Boolean);
      if (parts.length > 0) {
        detailData.address = parts.join(', ');
      }
    }

    // Extraer descripción
    if (typeof jsonLd.description === 'string') {
      detailData.description = jsonLd.description;
    }

    console.log(`[${this.name}]   📊 Extracted from JSON-LD:`, {
      date: detailData.date instanceof Date ? detailData.date.toISOString() : undefined,
      price: detailData.price,
      priceMax: detailData.priceMax,
      venue: detailData.venue,
      address: detailData.address,
    });

    return detailData;
  }

  /**
   * Scrapea la página de detalles de un evento
   */
  private async scrapeDetailPage(url: string): Promise<Record<string, unknown>> {
    if (!this.config.detailPage) {
      return {};
    }

    const { selectors, transforms, defaultValues } = this.config.detailPage;

    // Fetch HTML de la página de detalles
    const html = await this.fetchWithRetry(url);
    const $ = cheerio.load(html);

    // Nivel 1: Intentar extraer JSON-LD primero (más confiable)
    const jsonLd = this.extractJsonLd(html);
    if (jsonLd) {
      console.log(`[${this.name}]   ✅ JSON-LD found, extracting structured data...`);
      const jsonLdData = this.parseJsonLdToEventData(jsonLd);

      // Nivel 2 de fallback: si falta el precio en JSON-LD, intentar selector CSS de detailPage
      if (jsonLdData.price === undefined && selectors.price) {
        const priceSelector = selectors.price;
        let rawPrice: string | undefined;
        if (priceSelector.includes('@')) {
          const [cssSel, attrName] = priceSelector.split('@');
          rawPrice = $(cssSel).attr(attrName);
        } else {
          rawPrice = $(priceSelector).text().trim();
        }
        if (rawPrice) {
          const transformName = transforms?.price || 'extractPrice';
          const parsedPrice = applyTransform(transformName, rawPrice, this.config.baseUrl);
          if (typeof parsedPrice === 'number' && !isNaN(parsedPrice) && parsedPrice > 0) {
            jsonLdData.price = parsedPrice;
            console.log(`[${this.name}]   🔄 Fallback price from CSS selector: ${parsedPrice}`);
          }
        }
      }

      // Nivel 3 de fallback: si aún falta el precio, buscar en el texto de la descripción
      if (jsonLdData.price === undefined && typeof jsonLdData.description === 'string') {
        const descPrice = extractMovistarPrice(jsonLdData.description);
        if (descPrice !== undefined && descPrice > 0) {
          jsonLdData.price = descPrice;
          console.log(`[${this.name}]   🔄 Fallback price from description: ${descPrice}`);
        }
      }

      return jsonLdData;
    }

    console.log(`[${this.name}]   ⚠️  No JSON-LD found, using CSS selectors...`);

    const rawData: Record<string, string> = {};

    // Extraer campos usando selectores de detailPage
    console.log(`[${this.name}]   Trying ${Object.keys(selectors).length} selectors...`);
    Object.entries(selectors).forEach(([field, selector]) => {
      if (!selector) {
        // Si no hay selector, usar valor por defecto si existe
        if (defaultValues && field in defaultValues) {
          const defaultValue = defaultValues[field as keyof typeof defaultValues];
          if (defaultValue) {
            rawData[field] = defaultValue;
            console.log(`[${this.name}]   ℹ️  ${field}: using default value`);
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
        // Texto - para campo 'date', buscar en TODOS los elementos que coincidan
        if (field === 'date') {
          // Buscar en todos los elementos hasta encontrar uno con fecha válida
          const elements = $(selector);
          console.log(`[${this.name}]   🔍 Searching for date in ${elements.length} elements...`);

          for (let i = 0; i < elements.length; i++) {
            const text = $(elements[i]).text().trim();
            if (text && text.length > 0) {
              console.log(`[${this.name}]      [${i}] Testing: "${text.substring(0, 100)}..."`);
              // Si hay un transform para date, intentar parsearlo
              if (transforms && transforms.date) {
                try {
                  const parsed = applyTransform(transforms.date, text, this.config.baseUrl);
                  if (parsed instanceof Date && !isNaN(parsed.getTime())) {
                    value = text; // Guardar el texto que sí se pudo parsear
                    console.log(`[${this.name}]      ✅ Valid date found at index ${i}`);
                    break;
                  }
                } catch {
                  // Continuar buscando
                }
              } else {
                // Sin transform, tomar el primer elemento con texto
                value = text;
                break;
              }
            }
          }

          // Fallback: si no se encontró fecha en párrafos, intentar parsear del título
          if (!value && selectors.title) {
            const titleText = $(selectors.title).text().trim();
            if (titleText && transforms && transforms.date) {
              console.log(
                `[${this.name}]   🔄 No date in paragraphs, trying title: "${titleText.substring(0, 100)}..."`
              );
              try {
                const parsed = applyTransform(transforms.date, titleText, this.config.baseUrl);
                if (parsed instanceof Date && !isNaN(parsed.getTime())) {
                  value = titleText;
                  console.log(`[${this.name}]      ✅ Valid date found in title`);
                }
              } catch {
                console.log(`[${this.name}]      ❌ No valid date in title either`);
              }
            }
          }
        } else {
          // Para otros campos, comportamiento normal (primer elemento)
          value = $(selector).text().trim();
        }
      }

      if (value) {
        rawData[field] = cleanWhitespace(value);
        console.log(`[${this.name}]   ✅ ${field}: found via "${selector.substring(0, 40)}"`);
      } else {
        console.log(`[${this.name}]   ❌ ${field}: NOT found with "${selector.substring(0, 40)}"`);
        if (defaultValues && field in defaultValues) {
          // Si no se encontró valor, usar default si existe
          const defaultValue = defaultValues[field as keyof typeof defaultValues];
          if (defaultValue) {
            rawData[field] = defaultValue;
            console.log(`[${this.name}]   ℹ️  ${field}: using default value`);
          }
        }
      }
    });

    // Aplicar transformaciones específicas de detailPage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedData: Record<string, any> = { ...rawData };

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
            console.warn(
              `[${this.name}] Failed to transform detail field ${field}: ${errorMessage}`
            );
          }
        }
      });
    }

    // Fallback: si no se obtuvo precio por selector directo, buscar en el texto de la descripción
    if (transformedData.price === undefined && typeof transformedData.description === 'string') {
      const descPrice = extractMovistarPrice(transformedData.description);
      if (descPrice !== undefined && descPrice > 0) {
        transformedData.price = descPrice;
        console.log(`[${this.name}]   🔄 Fallback price from description: ${descPrice}`);
      }
    }

    return transformedData;
  }

  /**
   * Genera external ID único para evento
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private generateExternalId(data: Record<string, any>): string {
    // Usar link si existe, sino combinar title + date + venue
    if (data.link) {
      try {
        // 1. Resolver URL relativa a absoluta para consistencia (ej: /event/x -> https://base.com/event/x)
        // Esto permite que el mismo evento scrapeado de dos fuentes (una absoluta, otra relativa) genere el mismo ID
        const absoluteLink = toAbsoluteUrl(data.link, this.config.baseUrl);

        // 2. Intentar parsear URL para remover query params (estabilizar ID)
        const url = new URL(absoluteLink);
        // IMPORTANTE: Incluir origin para coincidir con IDs de otros scrapers (ej: AllAccess usa https://...)
        // Antes devolvíamos solo pathname, lo que causaba mismatch con IDs absolutos.
        return url.origin + url.pathname + url.hash;
      } catch {
        // Si falla, usar link raw pero intentando limpiar query params si es posible
        return data.link.split('?')[0];
      }
    }

    const parts = [data.title, data.date?.toISOString?.() || data.date, data.venue]
      .filter(Boolean)
      .join('_');

    return parts
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .substring(0, 100);
  }

  /**
   * Fetch HTML con retry
   */
  private async fetchWithRetry(url: string): Promise<string> {
    const retryConfig = this.config.errorHandling?.retry || {
      maxRetries: 3,
      initialDelay: 1000,
      backoffMultiplier: 2,
    };

    return this.limiter(() =>
      pRetry(
        async () => {
          const response = await this.httpClient.get(url);
          return response.data;
        },
        {
          retries: retryConfig.maxRetries,
          minTimeout: retryConfig.initialDelay,
          factor: retryConfig.backoffMultiplier,
          onFailedAttempt: (error: unknown) => {
            const failedAttemptError = error as { attemptNumber: number; retriesLeft: number };
            console.warn(
              `[${this.name}] Attempt ${failedAttemptError.attemptNumber} failed for ${url}. ${failedAttemptError.retriesLeft} retries left.`
            );
          },
        }
      )
    );
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
          config.errorHandling?.timeout ?? DEFAULT_SCRAPER_CONFIG.errorHandling?.timeout ?? 15000,
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
}
