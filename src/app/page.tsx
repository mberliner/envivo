import { PrismaEventRepository } from '@/features/events/data/repositories/PrismaEventRepository';
import { EventCard } from '@/features/events/ui/components/EventCard';

/**
 * Home Page - Server Component
 *
 * Muestra todos los eventos próximos ordenados por fecha
 */
export default async function HomePage() {
  const repository = new PrismaEventRepository();
  const events = await repository.findAll();

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            EnVivo
            <span className="text-purple-600">.</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Descubrí los mejores eventos musicales cerca tuyo
          </p>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            {events.length === 0 && 'No hay eventos disponibles'}
            {events.length === 1 && '1 evento encontrado'}
            {events.length > 1 && `${events.length} eventos encontrados`}
          </p>
        </div>

        {/* Grid de eventos */}
        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
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
              Ejecutá el scraping manual para obtener eventos desde Ticketmaster.
            </p>
            <div className="mt-6">
              <code className="bg-gray-100 text-sm text-gray-800 px-4 py-2 rounded-md inline-block">
                curl -X POST http://localhost:3000/api/admin/scraper/sync \<br />
                &nbsp;&nbsp;-H &quot;x-api-key: YOUR_ADMIN_API_KEY&quot;
              </code>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-600">
          <p>
            EnVivo MVP • Datos de{' '}
            <a
              href="https://developer.ticketmaster.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-700"
            >
              Ticketmaster
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
