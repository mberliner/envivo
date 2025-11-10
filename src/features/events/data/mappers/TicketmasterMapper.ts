import { RawEvent, EventCategory } from '@/features/events/domain/entities/Event';

/**
 * Tipo de respuesta de la API de Ticketmaster
 * Basado en Discovery API v2: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
 */
export interface TicketmasterEvent {
  id: string;
  name: string;
  type?: string;
  url?: string;
  dates: {
    start: {
      dateTime?: string;
      localDate?: string;
      localTime?: string;
    };
  };
  classifications?: Array<{
    segment?: { name?: string };
    genre?: { name?: string };
    subGenre?: { name?: string };
  }>;
  priceRanges?: Array<{
    type?: string;
    currency?: string;
    min?: number;
    max?: number;
  }>;
  images?: Array<{
    url?: string;
    width?: number;
    height?: number;
  }>;
  _embedded?: {
    venues?: Array<{
      name?: string;
      city?: { name?: string };
      state?: { name?: string; stateCode?: string };
      country?: { name?: string; countryCode?: string };
      address?: { line1?: string };
      location?: {
        latitude?: string;
        longitude?: string;
      };
    }>;
  };
}

/**
 * Mapper para convertir eventos de Ticketmaster a entidades Event del dominio
 */
export class TicketmasterMapper {
  /**
   * Convierte un evento de la API de Ticketmaster a un RawEvent
   */
  static toRawEvent(apiEvent: TicketmasterEvent): RawEvent {
    const venue = apiEvent._embedded?.venues?.[0];
    const classification = apiEvent.classifications?.[0];
    const priceRange = apiEvent.priceRanges?.[0];
    const image = apiEvent.images?.[0];

    // Construir fecha completa
    const dateTime = apiEvent.dates.start.dateTime;
    const localDate = apiEvent.dates.start.localDate;
    const localTime = apiEvent.dates.start.localTime;

    let eventDate: Date;
    if (dateTime) {
      eventDate = new Date(dateTime);
    } else if (localDate && localTime) {
      eventDate = new Date(`${localDate}T${localTime}`);
    } else if (localDate) {
      eventDate = new Date(`${localDate}T00:00:00`);
    } else {
      throw new Error(`Event ${apiEvent.id} has no valid date`);
    }

    return {
      title: apiEvent.name,
      description: undefined,
      date: eventDate,
      endDate: undefined,
      venue: venue?.name,
      city: venue?.city?.name,
      country: venue?.country?.countryCode,
      category: this.mapCategory(classification?.segment?.name, classification?.genre?.name),
      genre: classification?.genre?.name,
      artists: undefined,
      imageUrl: image?.url,
      ticketUrl: apiEvent.url,
      price: priceRange?.min ?? undefined,
      priceMax: priceRange?.max ?? undefined,
      currency: priceRange?.currency || 'USD',
      venueCapacity: undefined,
      externalId: apiEvent.id,
      // Campos adicionales específicos de Ticketmaster
      _source: 'ticketmaster', // Para que el repository sepa el source
      _ticketmaster: {
        url: apiEvent.url,
        segment: classification?.segment?.name,
        subGenre: classification?.subGenre?.name,
        venueAddress: venue?.address?.line1,
        state: venue?.state?.name,
        latitude: venue?.location?.latitude,
        longitude: venue?.location?.longitude,
      },
    };
  }

  /**
   * Mapea la categoría de Ticketmaster a nuestro enum EventCategory
   */
  private static mapCategory(segment?: string, genre?: string): EventCategory {
    const segmentLower = segment?.toLowerCase() || '';
    const genreLower = genre?.toLowerCase() || '';

    // Mapeo por segment
    if (segmentLower.includes('music')) {
      if (genreLower.includes('festival')) return 'Festival';
      return 'Concierto';
    }

    if (segmentLower.includes('arts')) {
      if (genreLower.includes('theatre') || genreLower.includes('theater')) return 'Teatro';
      if (genreLower.includes('opera')) return 'Ópera';
      if (genreLower.includes('ballet') || genreLower.includes('dance')) return 'Ballet';
      if (genreLower.includes('comedy') || genreLower.includes('stand-up')) return 'Stand-up';
      return 'Otro';
    }

    if (segmentLower.includes('film')) {
      return 'Otro';
    }

    if (segmentLower.includes('sports')) {
      return 'Otro';
    }

    // Mapeo por genre si segment no es concluyente
    if (genreLower.includes('comedy') || genreLower.includes('stand-up')) {
      return 'Stand-up';
    }

    if (genreLower.includes('festival')) {
      return 'Festival';
    }

    return 'Otro';
  }

  /**
   * Convierte un array de eventos de Ticketmaster a RawEvents
   * Filtra eventos que no se pueden mapear correctamente
   */
  static toRawEvents(apiEvents: TicketmasterEvent[]): RawEvent[] {
    const events: RawEvent[] = [];

    for (const apiEvent of apiEvents) {
      try {
        const event = this.toRawEvent(apiEvent);
        events.push(event);
      } catch (error) {
        // Log error pero continuar con otros eventos
        console.warn(`Failed to map Ticketmaster event ${apiEvent.id}:`, error);
      }
    }

    return events;
  }
}
