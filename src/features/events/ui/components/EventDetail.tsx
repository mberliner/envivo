'use client';

import Link from 'next/link';
import { Event } from '@/features/events/domain/entities/Event';
import { sanitizeHTML, isSafeURL } from '@/shared/utils/sanitize';

export interface EventDetailProps {
  event: Event;
}

/**
 * Event Detail Component
 *
 * Displays complete information about an event including:
 * - Hero image
 * - Title and metadata (date, venue, price, genre)
 * - Full description (sanitized HTML)
 * - Call-to-action button for ticket purchase
 * - Artists list (if available)
 *
 * Security:
 * - HTML description sanitized with DOMPurify
 * - URLs validated before rendering
 *
 * @example
 * ```tsx
 * <EventDetail event={event} />
 * ```
 */
export function EventDetail({ event }: EventDetailProps) {
  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price?: number | null, maxPrice?: number | null) => {
    if (price === 0) return 'Gratis';
    if (!price) return 'Precio no disponible';

    const formattedMin = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: event.currency || 'ARS',
      minimumFractionDigits: 0,
    }).format(price);

    if (maxPrice && maxPrice !== price) {
      const formattedMax = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: event.currency || 'ARS',
        minimumFractionDigits: 0,
      }).format(maxPrice);
      return `${formattedMin} - ${formattedMax}`;
    }

    return `Desde ${formattedMin}`;
  };

  // Sanitize description HTML
  const sanitizedDescription = sanitizeHTML(event.description);

  // Validate ticket URL
  const safeTicketUrl = event.ticketUrl && isSafeURL(event.ticketUrl) ? event.ticketUrl : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb / Back Link */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Volver a Eventos
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Image */}
        {event.imageUrl && (
          <div className="relative w-full aspect-video bg-gray-200 rounded-lg overflow-hidden shadow-lg mb-6">
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            {/* Category Badge */}
            <div className="absolute top-4 right-4">
              <span className="bg-purple-600 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg">
                {event.category}
              </span>
            </div>
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          {event.title}
        </h1>

        {/* Info Cards */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="space-y-4">
            {/* Date */}
            <div className="flex items-start">
              <svg
                className="w-6 h-6 text-purple-600 mr-3 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <div>
                <p className="text-sm text-gray-500 font-medium">Fecha y Hora</p>
                <p className="text-base text-gray-900 capitalize">
                  {formatDateTime(event.date)}
                </p>
                {event.endDate && (
                  <p className="text-sm text-gray-600 mt-1">
                    Hasta: {formatDateTime(event.endDate)}
                  </p>
                )}
              </div>
            </div>

            {/* Venue and Location */}
            <div className="flex items-start">
              <svg
                className="w-6 h-6 text-purple-600 mr-3 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <div>
                <p className="text-sm text-gray-500 font-medium">Ubicación</p>
                {event.venueName && (
                  <p className="text-base text-gray-900 font-medium">{event.venueName}</p>
                )}
                <p className="text-base text-gray-600">
                  {event.city}, {event.country}
                </p>
              </div>
            </div>

            {/* Genre */}
            {event.genre && (
              <div className="flex items-start">
                <svg
                  className="w-6 h-6 text-purple-600 mr-3 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  />
                </svg>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Género Musical</p>
                  <p className="text-base text-gray-900">{event.genre}</p>
                </div>
              </div>
            )}

            {/* Price */}
            <div className="flex items-start">
              <svg
                className="w-6 h-6 text-purple-600 mr-3 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-sm text-gray-500 font-medium">Precio de Entradas</p>
                <p className="text-base text-gray-900 font-semibold">
                  {formatPrice(event.price, event.priceMax)}
                </p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          {safeTicketUrl && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <a
                href={safeTicketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-purple-600 hover:bg-purple-700 text-white text-center font-semibold py-4 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                🎫 Comprar Entradas →
              </a>
            </div>
          )}
        </div>

        {/* Artists */}
        {event.artists && event.artists.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <svg
                className="w-6 h-6 text-purple-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Artistas
            </h2>
            <ul className="space-y-2">
              {event.artists.map((artist, index) => (
                <li key={index} className="flex items-center text-gray-700">
                  <span className="w-2 h-2 bg-purple-600 rounded-full mr-3"></span>
                  {artist}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Description */}
        {sanitizedDescription && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Descripción</h2>
            <div
              className="prose prose-sm md:prose-base max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
            />
          </div>
        )}

        {/* Additional Info */}
        {event.venueCapacity && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Información Adicional
            </h2>
            <div className="flex items-center text-gray-700">
              <svg
                className="w-5 h-5 text-purple-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>
                Capacidad aproximada:{' '}
                <strong>{event.venueCapacity.toLocaleString('es-AR')}</strong> personas
              </span>
            </div>
          </div>
        )}

        {/* Back Link (Bottom) */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Volver a Eventos
          </Link>
        </div>
      </div>
    </div>
  );
}
