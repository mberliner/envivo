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

/**
 * Estructura de una card dentro de un widget component de Crowder
 */
export interface CrowderCard {
  title?: string | null;
  description?: string | null;
  line1?: string | null;
  line2?: string | null;
  label?: string | null;
  buttonText?: string | null;
  link: string;
  imgUrl: string;
  content?: string | null;
  moveTimestamp?: number;
}

/**
 * Estructura de un widget component de tipo Grid
 */
export interface CrowderWidgetComponent {
  id: string;
  widgetType: string;
  state: {
    enabled: boolean;
    header?: {
      title?: string;
    };
    config?: {
      deviceVisibility?: string;
    };
    cards?: CrowderCard[];
  };
  version: number;
}

/**
 * Estructura del JSON en App.bootstrapData()
 */
export interface CrowderBootstrapData {
  model?: {
    data?: {
      widgetComponents?: CrowderWidgetComponent[];
    };
  };
}

/**
 * AllAccess JSON Scraper - Extrae eventos del JSON embebido en HTML
 */
export class AllAccessJsonScraper implements IDataSource {
  readonly name = 'allaccess';
  readonly type = 'web' as const;

  private readonly baseUrl = 'https://www.allaccess.com.ar';
  private readonly httpClient: AxiosInstance;

  constructor() {
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
      const events = AllAccessMapper.cardsToRawEvents(cards, this.baseUrl);

      console.log(`[${this.name}] ✅ Extracted ${events.length} events from homepage`);

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
    // Buscar patrón: App.bootstrapData({...});
    // Usar [\s\S] en lugar de . con flag /s para compatibilidad con ES2017
    const match = html.match(/App\.bootstrapData\(([\s\S]*?)\);(?:\s*App\.start\(\))?/);

    if (!match || !match[1]) {
      throw new Error('Could not find App.bootstrapData() in HTML');
    }

    try {
      // Parsear JSON (el contenido entre paréntesis)
      const jsonString = match[1].trim();
      const data = JSON.parse(jsonString) as CrowderBootstrapData;

      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to parse bootstrapData JSON: ${errorMessage}`);
    }
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

    console.log(
      `[${this.name}] Total cards: ${allCards.length}, unique: ${uniqueCards.length}`
    );

    return uniqueCards;
  }
}
