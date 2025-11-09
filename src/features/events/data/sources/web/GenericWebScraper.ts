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
import { applyTransform, cleanWhitespace, toAbsoluteUrl } from './utils/transforms';

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
  readonly type = 'scraper' as const;

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
    const $items = containerSelector
      ? $(containerSelector).find(itemSelector)
      : $(itemSelector);

    // Extraer datos de cada item
    $items.each((_, element) => {
      try {
        const $item = $(element);
        const eventData = this.extractEventData($item, $);

        if (eventData) {
          events.push(eventData);
        }
      } catch (error: unknown) {
        if (this.config.errorHandling?.skipFailedEvents) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.warn(
            `[${this.name}] Failed to extract event from item: ${errorMessage}`
          );
        } else {
          throw error;
        }
      }
    });

    return events;
  }

  /**
   * Extrae datos de un evento individual
   */
  private extractEventData(
    $item: cheerio.Cheerio<any>,
    $: cheerio.CheerioAPI
  ): RawEvent | null {
    const { selectors, transforms } = this.config;

    // Extraer todos los campos
    const rawData: Record<string, string> = {};

    Object.entries(selectors).forEach(([field, selector]) => {
      if (!selector) return;

      let value: string | undefined;

      // Extraer valor según el tipo de selector
      if (selector.startsWith('@')) {
        // Atributo (ej: "@href", "@src")
        const attrName = selector.substring(1);
        value = $item.find(selector.replace(`@${attrName}`, '')).attr(attrName);
      } else {
        // Texto
        value = $item.find(selector).text().trim();
      }

      if (value) {
        rawData[field] = cleanWhitespace(value);
      }
    });

    // Aplicar transformaciones
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
              `[${this.name}] Failed to transform field ${field}: ${errorMessage}`
            );
          }
        }
      });
    }

    // Validar campos obligatorios
    if (!transformedData.title || !transformedData.date || !transformedData.venue) {
      console.warn(
        `[${this.name}] Skipping event with missing required fields: title=${transformedData.title}, date=${transformedData.date}, venue=${transformedData.venue}`
      );
      return null;
    }

    // Construir RawEvent
    return {
      _source: this.name, // Using _source to match TicketmasterMapper pattern
      externalId: this.generateExternalId(transformedData),
      title: transformedData.title,
      date: transformedData.date,
      venue: transformedData.venue,
      city: transformedData.city,
      country: this.config.name.includes('argentina') ? 'AR' : undefined,
      address: transformedData.address,
      price: transformedData.price,
      currency: transformedData.price !== undefined ? 'ARS' : undefined,
      category: transformedData.category || 'Concierto',
      imageUrl: transformedData.image
        ? toAbsoluteUrl(transformedData.image, this.config.baseUrl)
        : undefined,
      externalUrl: transformedData.link
        ? toAbsoluteUrl(transformedData.link, this.config.baseUrl)
        : undefined,
      description: transformedData.description,
      ticketUrl: transformedData.link
        ? toAbsoluteUrl(transformedData.link, this.config.baseUrl)
        : undefined,
    };
  }

  /**
   * Genera external ID único para evento
   */
  private generateExternalId(data: Record<string, any>): string {
    // Usar link si existe, sino combinar title + date + venue
    if (data.link) {
      return data.link;
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
          onFailedAttempt: (error: any) => {
            console.warn(
              `[${this.name}] Attempt ${error.attemptNumber} failed for ${url}. ${error.retriesLeft} retries left.`
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
        skipFailedEvents: config.errorHandling?.skipFailedEvents ?? DEFAULT_SCRAPER_CONFIG.errorHandling?.skipFailedEvents ?? true,
        skipFailedPages: config.errorHandling?.skipFailedPages ?? DEFAULT_SCRAPER_CONFIG.errorHandling?.skipFailedPages ?? false,
        timeout: config.errorHandling?.timeout ?? DEFAULT_SCRAPER_CONFIG.errorHandling?.timeout ?? 15000,
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
