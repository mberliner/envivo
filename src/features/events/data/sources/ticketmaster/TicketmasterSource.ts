import axios from 'axios';
import { IDataSource } from '@/features/events/domain/interfaces/IDataSource';
import { RawEvent } from '@/features/events/domain/entities/Event';
import {
  TicketmasterMapper,
  TicketmasterEvent,
} from '@/features/events/data/mappers/TicketmasterMapper';
import { env } from '@/shared/infrastructure/config/env';

/**
 * Configuración específica de Ticketmaster
 */
export interface TicketmasterConfig {
  apiKey: string;
  countryCode?: string;
  city?: string;
  classificationName?: string; // "Music" para filtrar solo eventos musicales
  size?: number; // Número de resultados por página (máx 200)
  timeout?: number; // Timeout en ms
}

/**
 * DataSource para la API de Ticketmaster Discovery API v2
 * https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
 */
export class TicketmasterSource implements IDataSource {
  readonly name = 'ticketmaster';
  readonly type = 'api' as const;

  private config: TicketmasterConfig;
  private baseUrl = 'https://app.ticketmaster.com/discovery/v2/events.json';

  constructor(config?: Partial<TicketmasterConfig>) {
    this.config = {
      apiKey: config?.apiKey || env.TICKETMASTER_API_KEY || '',
      countryCode: config?.countryCode || 'AR', // Argentina por defecto
      classificationName: config?.classificationName || 'Music',
      size: config?.size || 100,
      timeout: config?.timeout || 10000,
    };

    if (!this.config.apiKey) {
      throw new Error('Ticketmaster API key is required');
    }
  }

  /**
   * Obtiene eventos de la API de Ticketmaster
   */
  async fetch(params?: { city?: string; country?: string }): Promise<RawEvent[]> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          apikey: this.config.apiKey,
          countryCode: params?.country || this.config.countryCode,
          city: params?.city || this.config.city,
          classificationName: this.config.classificationName,
          size: this.config.size,
          sort: 'date,asc', // Ordenar por fecha ascendente
        },
        timeout: this.config.timeout,
      });

      const apiEvents: TicketmasterEvent[] = response.data._embedded?.events || [];

      if (apiEvents.length === 0) {
        console.warn(`TicketmasterSource: No events found for country=${this.config.countryCode}`);
        return [];
      }

      // Usar el mapper para convertir a RawEvent[]
      const rawEvents = TicketmasterMapper.toRawEvents(apiEvents);

      console.log(
        `TicketmasterSource: Fetched ${apiEvents.length} events, mapped ${rawEvents.length} successfully`
      );

      return rawEvents;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Ticketmaster API: Invalid API key');
        }
        if (error.response?.status === 429) {
          throw new Error('Ticketmaster API: Rate limit exceeded');
        }
        if (error.code === 'ECONNABORTED') {
          throw new Error(`Ticketmaster API: Request timeout after ${this.config.timeout}ms`);
        }
        throw new Error(`Ticketmaster API error: ${error.message}`);
      }
      throw error;
    }
  }
}
