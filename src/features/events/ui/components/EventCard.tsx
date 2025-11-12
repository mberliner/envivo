import Link from 'next/link';
import Image from 'next/image';
import { Event } from '@/features/events/domain/entities/Event';
import { useState } from 'react';

export interface EventCardProps {
  event: Event;
  onDelete?: (eventId: string) => void;
}

/**
 * Tarjeta de evento individual
 * Muestra información básica del evento con diseño responsive
 */
export function EventCard({ event, onDelete }: EventCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  /**
   * Handle event deletion
   */
  const handleDelete = async () => {
    if (!confirm(`¿Estás seguro que querés ocultar "${event.title}"?\n\nEste evento no volverá a aparecer en futuros scrapings.`)) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      // Optimistic update: hide card immediately
      setIsDeleted(true);

      // Notify parent component
      if (onDelete) {
        onDelete(event.id);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Error al eliminar el evento. Por favor intentá de nuevo.');
      setIsDeleting(false);
    }
  };

  // Don't render if deleted
  if (isDeleted) {
    return null;
  }
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-AR', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
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

  return (
    <div data-testid="event-card" className={`border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 bg-white ${isDeleting ? 'opacity-50' : ''}`}>
      {/* Imagen del evento */}
      {event.imageUrl && (
        <div className="relative h-48 w-full bg-gray-100">
          <Link href={`/eventos/${event.id}`}>
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              className="object-cover cursor-pointer"
            />
          </Link>
          {/* Badge de categoría */}
          <div className="absolute top-2 right-2 flex gap-2">
            <span className="bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
              {event.category}
            </span>
          </div>

          {/* Botón de eliminar */}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="absolute top-2 left-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
            title="Ocultar este evento"
            aria-label="Ocultar evento"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Contenido */}
      <div className="p-4">
        {/* Título */}
        <Link href={`/eventos/${event.id}`}>
          <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 hover:text-purple-600 transition-colors cursor-pointer">
            {event.title}
          </h3>
        </Link>

        {/* Fecha */}
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <svg
            className="w-4 h-4 mr-2"
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
          <span>{formatDate(event.date)}</span>
        </div>

        {/* Ubicación */}
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <svg
            className="w-4 h-4 mr-2"
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
          <span>
            {event.venueName && <span className="font-medium">{event.venueName} • </span>}
            {event.city}, {event.country}
          </span>
        </div>

        {/* Género */}
        {event.genre && (
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <svg
              className="w-4 h-4 mr-2"
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
            <span>{event.genre}</span>
          </div>
        )}

        {/* Precio */}
        <div className="pt-3 border-t border-gray-100 mb-3">
          <p className="text-xs text-gray-500">Precio</p>
          <p className="text-sm font-semibold text-gray-900">
            {formatPrice(event.price, event.priceMax)}
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2">
          <Link
            href={`/eventos/${event.id}`}
            className="flex-1 bg-white hover:bg-gray-50 text-purple-600 border border-purple-600 text-sm font-medium px-4 py-2 rounded-md transition-colors duration-200 text-center"
          >
            Ver Detalles
          </Link>

          {event.ticketUrl && (
            <a
              href={event.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors duration-200 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              Comprar
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
