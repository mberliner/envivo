/**
 * AllAccess JSON Scraper
 *
 * Extrae eventos del JSON embebido en App.bootstrapData() en el HTML de AllAccess.
 * No scrape HTML con selectores CSS, sino que parsea el JavaScript embebido.
 *
 * Limitaciones:
 * - Solo extrae eventos de los bloques de homepage (widgetComponents)
 * - No scrape secciones adicionales ni páginas de detalle
 * - La información es limitada (título, fecha texto, link, imagen)
 */

import axios, { AxiosInstance } from 'axios';
import { IDataSource } from '@/features/events/domain/interfaces/IDataSource';
import { RawEvent } from '@/features/events/domain/entities/Event';
import { AllAccessMapper } from './AllAccessMapper';
import type {
  CrowderCard,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Re-exported for backward compatibility
  CrowderWidgetComponent,
  CrowderBootstrapData,
  SchemaOrgEvent,
  EventDetailData,
} from './AllAccessTypes';

// Re-export types for backward compatibility
export type {
  CrowderCard,
  CrowderWidgetComponent,
  CrowderBootstrapData,
  SchemaOrgEvent,
  EventDetailData,
} from './AllAccessTypes';

/**
 * AllAccess JSON Scraper - Extrae eventos del JSON embebido en HTML
 */
export class AllAccessJsonScraper implements IDataSource {
  readonly name = 'allaccess';
  readonly type = 'web' as const;

  private readonly baseUrl = 'https://www.allaccess.com.ar';
  private readonly httpClient: AxiosInstance;
  private readonly scrapeDetails: boolean;
  private readonly delayBetweenDetails: number;

  constructor(options?: { scrapeDetails?: boolean; delayBetweenDetails?: number }) {
    this.scrapeDetails = options?.scrapeDetails ?? true; // Enabled by default
    this.delayBetweenDetails = options?.delayBetweenDetails ?? 500; // 500ms between detail requests

    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
      },
    });
  }

  /**
   * Fetch eventos desde AllAccess
   */
  async fetch(): Promise<RawEvent[]> {
    try {
      // 1. Obtener HTML de la homepage
      const html = await this.fetchHomepage();

      // 2. Extraer JSON de App.bootstrapData()
      const bootstrapData = this.extractBootstrapData(html);

      // 3. Extraer cards de los widget components
      const cards = this.extractCards(bootstrapData);

      // 4. Mapear cards a RawEvents
      // Suprimir warnings de fechas si vamos a enriquecer con detail scraping
      const events = AllAccessMapper.cardsToRawEvents(cards, this.baseUrl, {
        suppressDateWarnings: this.scrapeDetails,
      });

      console.log(`[${this.name}] ✅ Extracted ${events.length} events from homepage`);

      // 5. Scrapear páginas de detalle si está habilitado
      if (this.scrapeDetails && events.length > 0) {
        console.log(`[${this.name}] 🔍 Scraping detail pages for ${events.length} events...`);
        await this.enrichWithDetailData(events);
      }

      return events;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to scrape ${this.name}: ${errorMessage}`);
    }
  }

  /**
   * Fetch HTML de la homepage
   */
  private async fetchHomepage(): Promise<string> {
    try {
      const response = await this.httpClient.get('/');
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch homepage: ${errorMessage}`);
    }
  }

  /**
   * Extrae el JSON de App.bootstrapData() del HTML
   */
  private extractBootstrapData(html: string): CrowderBootstrapData {
    const marker = 'App.bootstrapData(';
    const markerIdx = html.indexOf(marker);

    if (markerIdx === -1) {
      throw new Error('Could not find App.bootstrapData() in HTML');
    }

    // Localizar el inicio del objeto JSON (primer '{' luego del marcador)
    const objStart = html.indexOf('{', markerIdx + marker.length);

    if (objStart === -1) {
      throw new Error('Could not find App.bootstrapData() in HTML');
    }

    // Extraer el objeto por balanceo de llaves respetando strings.
    // El regex non-greedy previo cortaba en el primer ");" del HTML, que
    // aparece dentro de strings del JSON (ej. CSS "url(...png);"), truncando
    // el JSON y produciendo "Unterminated string in JSON".
    const jsonString = this.extractBalancedObject(html, objStart);

    if (jsonString === null) {
      throw new Error('Failed to parse bootstrapData JSON: unbalanced braces');
    }

    try {
      return JSON.parse(jsonString) as CrowderBootstrapData;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to parse bootstrapData JSON: ${errorMessage}`);
    }
  }

  /**
   * Extrae un objeto JSON balanceado desde la posición de su '{' inicial.
   *
   * Cuenta llaves respetando strings (con sus escapes) para no cortar en
   * llaves o paréntesis que aparezcan dentro de valores string.
   *
   * @param text - HTML completo
   * @param start - índice del '{' de apertura del objeto
   * @returns el substring del objeto JSON, o null si las llaves no balancean
   */
  private extractBalancedObject(text: string, start: number): string | null {
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < text.length; i++) {
      const char = text[i];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (char === '"') {
          inString = false;
        }
        continue;
      }

      if (char === '"') {
        inString = true;
      } else if (char === '{') {
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0) {
          return text.slice(start, i + 1);
        }
      }
    }

    return null;
  }

  /**
   * Enriquece eventos con datos de páginas de detalle
   */
  private async enrichWithDetailData(events: RawEvent[]): Promise<void> {
    for (let i = 0; i < events.length; i++) {
      const event = events[i];

      if (!event.externalUrl) {
        continue;
      }

      try {
        console.log(
          `[${this.name}]   [${i + 1}/${events.length}] Scraping details: ${event.title}`
        );

        const detailData = await this.scrapeDetailPage(event.externalUrl);

        // Enriquecer evento con datos adicionales
        if (detailData.startTime) {
          event.date = detailData.startTime;
        }
        if (detailData.price !== undefined) {
          event.price = detailData.price;
        }
        if (detailData.priceMax !== undefined) {
          event.priceMax = detailData.priceMax;
        }
        if (detailData.venue) {
          event.venue = detailData.venue;
        }
        if (detailData.address) {
          event.address = detailData.address;
        }

        // Delay entre requests
        if (i < events.length - 1) {
          await this.sleep(this.delayBetweenDetails);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn(
          `[${this.name}]   ⚠️  Failed to scrape details for ${event.title}: ${errorMessage}`
        );
        // Continuar con el siguiente evento
      }
    }

    console.log(`[${this.name}] ✅ Detail scraping completed`);
  }

  /**
   * Scrapea la página de detalle de un evento para extraer JSON-LD
   */
  private async scrapeDetailPage(url: string): Promise<EventDetailData> {
    const html = await this.fetchUrl(url);
    const jsonLd = this.extractJsonLd(html);

    const detailData: EventDetailData = {};

    if (jsonLd) {
      // Extraer hora del evento
      if (jsonLd.startDate) {
        detailData.startTime = new Date(jsonLd.startDate);
      }
      if (jsonLd.endDate) {
        detailData.endTime = new Date(jsonLd.endDate);
      }

      // Extraer precio (mínimo y máximo)
      // Soporta: array de offers, objeto único, precio como string o número
      const offersRaw = jsonLd.offers;
      if (offersRaw) {
        const offersArray = Array.isArray(offersRaw) ? offersRaw : [offersRaw];
        const prices = offersArray
          .map((offer) => {
            const p = offer.price;
            if (typeof p === 'number') return p;
            if (typeof p === 'string') return parseFloat(p);
            return NaN;
          })
          .filter((price): price is number => !isNaN(price));

        if (prices.length > 0) {
          detailData.price = Math.min(...prices);
          detailData.priceMax = Math.max(...prices);
        }
      }

      // Extraer venue y dirección
      if (jsonLd.location?.name) {
        detailData.venue = jsonLd.location.name;
      }
      if (jsonLd.location?.address) {
        const addr = jsonLd.location.address;
        const parts = [addr.streetAddress, addr.addressLocality, addr.postalCode].filter(Boolean);
        if (parts.length > 0) {
          detailData.address = parts.join(', ');
        }
      }
    }

    return detailData;
  }

  /**
   * Extrae el JSON-LD (schema.org) de la página de detalle
   */
  private extractJsonLd(html: string): SchemaOrgEvent | null {
    // Buscar script tag con type="application/ld+json"
    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);

    if (!match || !match[1]) {
      return null;
    }

    try {
      const jsonString = match[1].trim();
      const data = JSON.parse(jsonString) as SchemaOrgEvent;

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
   * Fetch URL con retry (para páginas de detalle)
   */
  private async fetchUrl(url: string): Promise<string> {
    try {
      const response = await this.httpClient.get(url);
      return response.data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch ${url}: ${errorMessage}`);
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Extrae todas las cards de eventos de los widget components
   *
   * Solo procesa widgets de tipo "Grid" que tengan cards.
   * Filtra widgets mobile-only para evitar duplicados.
   */
  private extractCards(bootstrapData: CrowderBootstrapData): CrowderCard[] {
    const widgetComponents = bootstrapData?.model?.data?.widgetComponents;

    if (!widgetComponents || !Array.isArray(widgetComponents)) {
      console.warn(`[${this.name}] No widgetComponents found in bootstrapData`);
      return [];
    }

    const allCards: CrowderCard[] = [];

    for (const widget of widgetComponents) {
      // Solo procesar widgets de tipo Grid que estén habilitados
      if (widget.widgetType !== 'Grid' || !widget.state?.enabled) {
        continue;
      }

      // Filtrar widgets mobile-only para evitar duplicados
      // (los eventos suelen estar duplicados en versiones mobile y desktop)
      if (widget.state?.config?.deviceVisibility === 'show_mobile') {
        console.log(`[${this.name}] Skipping mobile-only widget: ${widget.id}`);
        continue;
      }

      // Extraer cards
      const cards = widget.state?.cards;
      if (!cards || !Array.isArray(cards)) {
        continue;
      }

      // Filtrar cards que tienen link (son eventos)
      const eventCards = cards.filter((card) => {
        // Una card es un evento si:
        // 1. Tiene un link que apunta a /event/ o /page/
        // 2. Tiene título (aunque puede ser null en algunas cards compactas)
        return (
          card.link &&
          typeof card.link === 'string' &&
          (card.link.includes('/event/') || card.link.includes('/page/'))
        );
      });

      console.log(
        `[${this.name}] Widget "${widget.state?.header?.title || widget.id}": ${eventCards.length} event cards`
      );

      allCards.push(...eventCards);
    }

    // Deduplicar por link (pueden haber eventos repetidos en diferentes widgets)
    const uniqueCards = Array.from(new Map(allCards.map((card) => [card.link, card])).values());

    console.log(`[${this.name}] Total cards: ${allCards.length}, unique: ${uniqueCards.length}`);

    return uniqueCards;
  }
}
