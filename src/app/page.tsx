import { Suspense } from 'react';
import { createSearchService } from '@/shared/infrastructure/factories/service-factory';
import { EventsPage } from '@/features/events/ui/components/EventsPage';

/**
 * Home Page - Server Component
 *
 * Obtiene datos iniciales (ciudades, categorías) desde el servidor
 * y renderiza el EventsPage client component
 */
export default async function HomePage() {
  const searchService = createSearchService();

  // Obtener listas de ciudades y categorías disponibles
  const [cities, categories] = await Promise.all([
    searchService.getAvailableCities(),
    searchService.getAvailableCategories(),
  ]);

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      }
    >
      <EventsPage initialCities={cities} initialCategories={categories} />
    </Suspense>
  );
}
