'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQueryParams } from '@/shared/hooks/useQueryParams';
import { SearchBar } from './SearchBar';
import { EventFilters } from './EventFilters';
import { EventCard } from './EventCard';
import { Event } from '@/features/events/domain/entities/Event';

interface EventsPageProps {
  /** Ciudades iniciales disponibles */
  initialCities: string[];
  /** Categorías iniciales disponibles */
  initialCategories: string[];
}

/**
 * Página principal de eventos con búsqueda y filtros
 *
 * Client Component que:
 * - Sincroniza state con URL query params
 * - Hace fetch al API /api/events
 * - Muestra SearchBar, EventFilters, y EventCards
 * - Maneja loading y error states
 */
export function EventsPage({ initialCities, initialCategories }: EventsPageProps) {
  const { params, setParams } = useQueryParams();

  // State
  const [events, setEvents] = useState<Event[]>([]);
  const [cities] = useState<string[]>(initialCities); // TODO: Add city filtering
  const [categories] = useState<string[]>(initialCategories); // TODO: Add category filtering
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const limit = 50;

  // Leer filtros de URL
  const searchQuery = params.get('q') || '';
  const cityFilter = params.get('city') || '';
  const categoryFilter = params.get('category') || '';
  const dateFromFilter = params.get('dateFrom') || '';
  const dateToFilter = params.get('dateTo') || '';

  /**
   * Fetch eventos desde API
   */
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Construir query string
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.set('q', searchQuery);
      if (cityFilter) queryParams.set('city', cityFilter);
      if (categoryFilter) queryParams.set('category', categoryFilter);
      if (dateFromFilter) queryParams.set('dateFrom', new Date(dateFromFilter).toISOString());
      if (dateToFilter) queryParams.set('dateTo', new Date(dateToFilter).toISOString());

      // Pagination params
      queryParams.set('limit', limit.toString());
      queryParams.set('offset', offset.toString());

      const url = `/api/events?${queryParams.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Error al buscar eventos');
      }

      const data = await response.json();
      setEvents(data.events || []);
      setTotal(data.total || 0);
      setHasMore(data.hasMore || false);

      // Actualizar listas de ciudades y categorías disponibles
      // (opcional: solo si queremos que sea dinámico)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setEvents([]);
      setTotal(0);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, cityFilter, categoryFilter, dateFromFilter, dateToFilter, offset, limit]);

  /**
   * Reset offset when filters change
   */
  useEffect(() => {
    setOffset(0);
  }, [searchQuery, cityFilter, categoryFilter, dateFromFilter, dateToFilter]);

  /**
   * Fetch inicial y cuando cambian los filtros o la paginación
   *
   * IMPORTANTE: Usamos las variables primitivas directamente como dependencias
   * en lugar de fetchEvents para evitar loops infinitos
   */
  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, cityFilter, categoryFilter, dateFromFilter, dateToFilter, offset]);

  /**
   * Handler para cambios en SearchBar
   */
  const handleSearch = useCallback(
    (query: string) => {
      setParams({ q: query });
    },
    [setParams]
  );

  /**
   * Handler para cambios en EventFilters
   */
  const handleFiltersChange = useCallback(
    (filters: { city?: string; category?: string; dateFrom?: string; dateTo?: string }) => {
      setParams({
        city: filters.city,
        category: filters.category,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      });
    },
    [setParams]
  );

  /**
   * Pagination handlers
   */
  const handleNextPage = useCallback(() => {
    if (hasMore) {
      setOffset((prev) => prev + limit);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [hasMore, limit]);

  const handlePrevPage = useCallback(() => {
    if (offset > 0) {
      setOffset((prev) => Math.max(0, prev - limit));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [offset, limit]);

  /**
   * Handle event deletion
   */
  const handleEventDelete = useCallback((eventId: string) => {
    // Remove event from local state immediately (optimistic update)
    setEvents((prevEvents) => prevEvents.filter((e) => e.id !== eventId));
    setTotal((prevTotal) => Math.max(0, prevTotal - 1));
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            EnVivo
            <span className="text-purple-600">.</span>
          </h1>
          <p className="text-gray-600 mt-1">Descubrí los mejores eventos musicales cerca tuyo</p>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="container mx-auto px-4 py-8">
        {/* SearchBar */}
        <div className="mb-6">
          <SearchBar initialValue={searchQuery} onSearch={handleSearch} />
        </div>

        {/* Filters */}
        <div className="mb-6">
          <EventFilters
            cities={cities}
            categories={categories}
            initialFilters={{
              city: cityFilter,
              category: categoryFilter,
              dateFrom: dateFromFilter,
              dateTo: dateToFilter,
            }}
            onFiltersChange={handleFiltersChange}
          />
        </div>

        {/* Stats */}
        <div className="mb-6">
          {loading ? (
            <p className="text-sm text-gray-600">Buscando eventos...</p>
          ) : (
            <p className="text-sm text-gray-600">
              {total === 0 && 'No se encontraron eventos'}
              {total === 1 && '1 evento encontrado'}
              {total > 1 &&
                `${total} eventos encontrados • Mostrando ${offset + 1}-${Math.min(offset + limit, total)}`}
            </p>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        )}

        {/* Grid de eventos */}
        {!loading && events.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard key={event.id} event={event} onDelete={handleEventDelete} />
              ))}
            </div>

            {/* Pagination Controls */}
            {total > limit && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  onClick={handlePrevPage}
                  disabled={offset === 0}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    offset === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  ← Anterior
                </button>

                <span className="text-sm text-gray-600">
                  Página {Math.floor(offset / limit) + 1} de {Math.ceil(total / limit)}
                </span>

                <button
                  onClick={handleNextPage}
                  disabled={!hasMore}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    !hasMore
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!loading && events.length === 0 && !error && (
          <div className="text-center py-16">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay eventos</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || cityFilter || categoryFilter || dateFromFilter || dateToFilter
                ? 'Intentá con otros filtros'
                : 'Ejecutá el scraping manual para obtener eventos.'}
            </p>
            {!searchQuery && !cityFilter && !categoryFilter && !dateFromFilter && !dateToFilter && (
              <div className="mt-6 space-y-2">
                <code className="bg-gray-100 text-xs text-gray-800 px-4 py-2 rounded-md inline-block">
                  curl -X POST http://localhost:3000/api/admin/scraper/sync \<br />
                  &nbsp;&nbsp;-H &quot;x-api-key: YOUR_ADMIN_API_KEY&quot;
                </code>
                <p className="text-xs text-gray-500">
                  Más métodos en{' '}
                  <a
                    href="/docs/WEB_SCRAPING.md#scraping-manual"
                    className="text-purple-600 hover:text-purple-700 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    docs/WEB_SCRAPING.md
                  </a>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-600">
          <p>
            EnVivo MVP • Proyecto Open Source{' '}
            <a
              href="https://github.com/mberliner/envivo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-700"
            >
              Ver en GitHub
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
