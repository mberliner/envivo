import Link from 'next/link';

/**
 * 404 Not Found Page for Event Detail
 *
 * Displayed when:
 * - Event ID doesn't exist in database
 * - Event was deleted
 * - Invalid event ID format
 *
 * Provides:
 * - Clear error message
 * - Link back to events list
 * - Friendly UX
 */
export default function EventNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Icon */}
        <div className="mb-8">
          <svg
            className="mx-auto h-24 w-24 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Evento no encontrado</h1>
        <p className="text-lg text-gray-600 mb-8">
          El evento que estás buscando no existe o fue eliminado.
        </p>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Ver Todos los Eventos
          </Link>

          <Link
            href="/"
            className="block w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-lg border border-gray-300 transition-colors duration-200"
          >
            Volver al Inicio
          </Link>
        </div>

        {/* Help Text */}
        <p className="mt-8 text-sm text-gray-500">
          Si creés que esto es un error, por favor{' '}
          <a
            href="mailto:support@envivo.com"
            className="text-purple-600 hover:text-purple-700 underline"
          >
            contactanos
          </a>
          .
        </p>
      </div>
    </div>
  );
}
