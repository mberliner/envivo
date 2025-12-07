/**
 * SearchService
 *
 * Servicio de dominio para búsqueda y filtrado de eventos.
 *
 * Responsabilidades:
 * - Búsqueda por texto (título, nombre del venue)
 * - Filtrado por ciudad, categoría, rango de fechas
 * - Combinación de múltiples filtros
 * - Normalización de queries (case-insensitive, sin acentos)
 *
 * @module Domain/Services
 */

import { Event } from '../entities/Event';
import { IEventRepository, EventFilters } from '../interfaces/IEventRepository';

export interface SearchQuery {
  q?: string; // Texto de búsqueda
  city?: string; // Ciudad
  category?: string; // Categoría
  dateFrom?: Date; // Fecha desde
  dateTo?: Date; // Fecha hasta
  limit?: number; // Límite de resultados
  offset?: number; // Offset para paginación
}

export interface SearchResult {
  events: Event[];
  total: number;
  hasMore: boolean;
}

/**
 * Servicio para búsqueda y filtrado de eventos
 */
export class SearchService {
  constructor(private readonly repository: IEventRepository) {}

  /**
   * Buscar eventos con filtros combinables
   *
   * @param query - Query de búsqueda con filtros opcionales
   * @returns Eventos que coinciden con los filtros
   */
  async search(query: SearchQuery): Promise<SearchResult> {
    const { q, city, category, dateFrom, dateTo, limit = 50, offset = 0 } = query;

    // Construir filtros para el repository
    const filters: EventFilters = {};

    // Filtro por texto
    if (q && q.trim().length >= 2) {
      filters.search = this.normalizeSearchQuery(q);
    }

    // Filtro por ciudad
    if (city) {
      filters.city = city;
    }

    // Filtro por categoría
    if (category) {
      filters.category = category;
    }

    // Filtro por rango de fechas
    if (dateFrom) {
      filters.dateFrom = dateFrom;
    }

    if (dateTo) {
      filters.dateTo = dateTo;
    }

    // Buscar eventos
    const events = await this.repository.findByFilters(filters);

    // Aplicar paginación (en memoria por ahora)
    const paginatedEvents = events.slice(offset, offset + limit);

    return {
      events: paginatedEvents,
      total: events.length,
      hasMore: events.length > offset + limit,
    };
  }

  /**
   * Normaliza query de búsqueda para mejorar coincidencias
   *
   * - Convierte a minúsculas
   * - Elimina acentos
   * - Trim de espacios
   *
   * @param query - Query original
   * @returns Query normalizada
   */
  private normalizeSearchQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .normalize('NFD') // Descompone caracteres con acentos
      .replace(/[\u0300-\u036f]/g, ''); // Elimina acentos
  }

  /**
   * Obtener lista de ciudades disponibles (con eventos)
   *
   * @returns Lista de ciudades ordenadas alfabéticamente
   */
  async getAvailableCities(): Promise<string[]> {
    const events = await this.repository.findAll();
    const cities = new Set(events.map((e) => e.city));
    return Array.from(cities).sort();
  }

  /**
   * Obtener lista de categorías disponibles (con eventos)
   *
   * @returns Lista de categorías ordenadas alfabéticamente
   */
  async getAvailableCategories(): Promise<string[]> {
    const events = await this.repository.findAll();
    const categories = new Set(events.map((e) => e.category));
    return Array.from(categories).sort();
  }

  /**
   * Buscar eventos sugeridos basados en texto (autocomplete)
   *
   * @param query - Texto parcial
   * @param limit - Límite de sugerencias (default: 5)
   * @returns Lista de títulos sugeridos
   */
  async suggest(query: string, limit: number = 5): Promise<string[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const normalizedQuery = this.normalizeSearchQuery(query);
    const events = await this.repository.findAll();

    // Buscar coincidencias en título
    const suggestions = events
      .filter((e) => {
        const normalizedTitle = this.normalizeSearchQuery(e.title);
        return normalizedTitle.includes(normalizedQuery);
      })
      .map((e) => e.title)
      .slice(0, limit);

    return suggestions;
  }
}
