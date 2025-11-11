/**
 * Event Entity
 *
 * Entidad principal que representa un evento musical
 *
 * @module Domain/Entities
 */

export interface Event {
  id: string;
  title: string;
  description?: string;
  date: Date;
  endDate?: Date;

  // Ubicación
  venueId?: string;
  venueName?: string;
  city: string;
  country: string;

  // Categorización
  category: EventCategory;
  genre?: string;

  // Artistas
  artists?: string[]; // Nombres de artistas

  // Información adicional
  imageUrl?: string;
  ticketUrl?: string;
  price?: number;
  priceMax?: number;
  currency: string;

  // Capacidad del venue (para filtrado por tamaño)
  venueCapacity?: number;

  // Metadatos
  source: string; // "ticketmaster", "eventbrite", "scraper_local"
  externalId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Categorías de eventos disponibles
 */
export type EventCategory =
  | 'Concierto'
  | 'Festival'
  | 'Teatro'
  | 'Stand-up'
  | 'Ópera'
  | 'Ballet'
  | 'Otro';

/**
 * Evento sin procesar (raw) de las fuentes de datos
 */
export interface RawEvent {
  title: string;
  description?: string;
  date: string | Date;
  endDate?: string | Date;
  venue?: string;
  city?: string;
  country?: string;
  category?: string;
  genre?: string;
  artists?: string[];
  imageUrl?: string;
  ticketUrl?: string;
  price?: number;
  priceMax?: number;
  currency?: string;
  venueCapacity?: number;
  externalId?: string;
  [key: string]: unknown; // Permite propiedades adicionales específicas de la fuente
}
