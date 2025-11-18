/**
 * AllAccess Mapper
 *
 * Mapea cards de Crowder (extraídas de App.bootstrapData()) a RawEvent.
 *
 * Responsabilidades:
 * - Convertir formato de card de Crowder a RawEvent
 * - Parsear fechas en formato español ("21 de Noviembre")
 * - Inferir año actual cuando no está presente
 * - Construir URLs absolutas
 * - Extraer venue name del link cuando sea posible
 */

import { RawEvent } from '@/features/events/domain/entities/Event';
import type { CrowderCard } from './AllAccessJsonScraper';

/**
 * Mapper para eventos de AllAccess (Crowder platform)
 */
export class AllAccessMapper {
  /**
   * Mapea una card de Crowder a RawEvent
   */
  static cardToRawEvent(card: CrowderCard, baseUrl: string): RawEvent | null {
    // Validar campos mínimos requeridos
    if (!card.link) {
      console.warn('[AllAccessMapper] Card without link, skipping');
      return null;
    }

    // Construir URL absoluta
    const externalUrl = this.toAbsoluteUrl(card.link, baseUrl);

    // Parsear fecha (puede estar en description, line1, o line2)
    const dateString = card.description || card.line1 || card.line2;
    let date: Date | string | undefined;

    if (dateString && typeof dateString === 'string') {
      date = this.parseSpanishDate(dateString);
    }

    // Si no hay fecha válida, usar placeholder
    if (!date) {
      console.warn(
        `[AllAccessMapper] No valid date for event: ${card.title || card.link}, using placeholder`
      );
      // Usar fecha futura genérica (será rechazado por business rules si hay validación estricta)
      date = new Date(new Date().getFullYear(), 11, 31); // 31 diciembre del año actual
    }

    // Extraer venue name del link si es posible
    // Ej: "/event/buenos-vampiros-en-vorterix" → inferir venue
    const venueName = this.inferVenueFromLink(card.link);

    // Construir RawEvent (campos básicos de homepage)
    // Nota: price, priceMax, address y hora exacta se agregan después
    // si se scrape la página de detalle
    return {
      _source: 'allaccess',
      externalId: externalUrl,
      title: card.title || this.extractTitleFromLink(card.link),
      description: card.content || undefined,
      date,
      venue: venueName,
      city: 'Buenos Aires', // AllAccess es principalmente Buenos Aires
      country: 'AR',
      category: 'Concierto', // Default, puede ajustarse según el evento
      imageUrl: card.imgUrl ? this.toAbsoluteUrl(card.imgUrl, baseUrl) : undefined,
      externalUrl,
      ticketUrl: externalUrl,
      // Estos campos se enriquecen con detail scraping:
      // - date (startTime con hora exacta)
      // - price (precio mínimo)
      // - priceMax (precio máximo)
      // - address (dirección completa)
      // - venue (confirmado desde JSON-LD)
    };
  }

  /**
   * Mapea un array de cards a RawEvents
   */
  static cardsToRawEvents(cards: CrowderCard[], baseUrl: string): RawEvent[] {
    const events: RawEvent[] = [];

    for (const card of cards) {
      const event = this.cardToRawEvent(card, baseUrl);
      if (event) {
        events.push(event);
      }
    }

    return events;
  }

  /**
   * Parsea fecha en formato español
   *
   * Formatos soportados:
   * - "21 de Noviembre" → Date(año_actual, 10, 21)
   * - "21&nbsp;de Noviembre" → Date(año_actual, 10, 21)
   * - "22 de Noviembre" → Date(año_actual, 10, 22)
   *
   * NOTA: No incluye año, se asume año actual.
   * Si la fecha ya pasó, se asume año siguiente.
   */
  private static parseSpanishDate(dateString: string): Date | undefined {
    // Limpiar HTML entities
    const cleaned = dateString.replace(/&nbsp;/g, ' ').trim();

    // Patrón: "DD de MONTH"
    const monthNames: Record<string, number> = {
      enero: 0,
      febrero: 1,
      marzo: 2,
      abril: 3,
      mayo: 4,
      junio: 5,
      julio: 6,
      agosto: 7,
      septiembre: 8,
      setiembre: 8, // Variante
      octubre: 9,
      noviembre: 10,
      diciembre: 11,
    };

    const match = cleaned.match(/(\d{1,2})\s+de\s+(\w+)/i);

    if (!match) {
      return undefined;
    }

    const day = parseInt(match[1], 10);
    const monthName = match[2].toLowerCase();
    const month = monthNames[monthName];

    if (month === undefined || isNaN(day) || day < 1 || day > 31) {
      return undefined;
    }

    // Construir fecha con año actual
    const now = new Date();
    const currentYear = now.getFullYear();
    let date = new Date(currentYear, month, day);

    // Si la fecha ya pasó, asumir año siguiente
    if (date < now) {
      date = new Date(currentYear + 1, month, day);
    }

    return date;
  }

  /**
   * Convierte URL relativa a absoluta
   */
  private static toAbsoluteUrl(url: string, baseUrl: string): string {
    // Si ya es absoluta, retornar tal cual
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Manejar URLs relativas que empiezan con "../"
    if (url.startsWith('../')) {
      return `${baseUrl}/${url.replace(/^\.\.\//, '')}`;
    }

    // Manejar URLs relativas normales
    if (url.startsWith('/')) {
      return `${baseUrl}${url}`;
    }

    // Default: agregar "/"
    return `${baseUrl}/${url}`;
  }

  /**
   * Intenta inferir el venue name del link del evento
   *
   * Ej: "/event/buenos-vampiros-en-vorterix" → "Teatro Vorterix"
   * Ej: "/event/los-espiritus" (The Roxy Live) → "The Roxy Live"
   *
   * NOTA: Esto es un best-effort. No todos los links tienen venue en el nombre.
   */
  private static inferVenueFromLink(link: string): string | undefined {
    // Patrones conocidos de venues en AllAccess
    const venuePatterns: Record<string, RegExp> = {
      'Teatro Vorterix': /-en-vorterix|-vorterix/i,
      'The Roxy Live': /-roxy-live/i,
      'The Roxy Bar': /-roxy-bar/i,
      'Movistar Arena': /-movistar-arena/i,
      'Estadio River Plate': /-river-plate|-estadio-river/i,
      'Teatro Colón': /-teatro-colon/i,
      'Hipódromo de San Isidro': /-hipodromo/i,
    };

    for (const [venueName, pattern] of Object.entries(venuePatterns)) {
      if (pattern.test(link)) {
        return venueName;
      }
    }

    // No se pudo inferir venue
    return undefined;
  }

  /**
   * Extrae un título legible del link cuando no hay título en la card
   *
   * Ej: "/event/buenos-vampiros-en-vorterix" → "Buenos Vampiros En Vorterix"
   */
  private static extractTitleFromLink(link: string): string {
    // Extraer slug del link
    const match = link.match(/\/(?:event|page)\/([^/?]+)/);

    if (!match) {
      return 'Untitled Event';
    }

    const slug = match[1];

    // Convertir kebab-case a Title Case
    return slug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
