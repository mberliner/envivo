/**
 * GlobalPreferences Entity
 *
 * Representa las preferencias globales del sistema para filtrado de eventos
 * durante el proceso de scraping.
 *
 * @module Domain/Entities
 */

export interface GlobalPreferences {
  id: string; // Siempre "singleton"

  // Ubicación
  allowedCountries: string[]; // Códigos ISO de países (ej: ["AR", "UY", "CL"])
  allowedCities: string[]; // Nombres de ciudades (ej: ["Buenos Aires", "Montevideo"])

  // Géneros musicales
  allowedGenres: string[]; // Géneros permitidos (ej: ["Rock", "Pop", "Jazz"])
  blockedGenres: string[]; // Géneros bloqueados explícitamente (lista negra)

  // Categorías de eventos
  allowedCategories: string[]; // Categorías permitidas (ej: ["Concierto", "Festival"])

  // Capacidad de venues
  allowedVenueSizes: VenueSize[]; // Tamaños permitidos (ej: ["small", "medium"])
  venueSizeThresholds: VenueSizeThresholds; // Umbrales para clasificar venues

  // Control de estado
  needsRescraping: boolean; // Si las preferencias cambiaron y se necesita re-scrapear
  updatedAt: Date;
  updatedBy?: string; // Usuario que actualizó (opcional, para auditoría)
}

/**
 * Tamaños de venue disponibles
 */
export type VenueSize = 'small' | 'medium' | 'large';

/**
 * Umbrales para clasificar venues por capacidad
 */
export interface VenueSizeThresholds {
  small: number; // Capacidad máxima para "small" (ej: 500)
  medium: number; // Capacidad máxima para "medium" (ej: 2000)
  large: number; // Capacidad máxima para "large" (ej: 5000+)
}

/**
 * Preferencias por defecto del sistema
 */
export const DEFAULT_PREFERENCES: Omit<GlobalPreferences, 'id' | 'updatedAt'> = {
  // MVP: Solo Argentina
  allowedCountries: ['AR'],

  // MVP: Buenos Aires (ciudad + provincia)
  allowedCities: ['Buenos Aires', 'Ciudad de Buenos Aires', 'CABA'],

  // Todos los géneros permitidos (vacío = todos)
  allowedGenres: [],

  // Sin géneros bloqueados
  blockedGenres: [],

  // Categorías permitidas (en español, debe coincidir con scrapers)
  allowedCategories: ['Concierto', 'Festival', 'Teatro'],

  // Todos los tamaños de venue
  allowedVenueSizes: ['small', 'medium', 'large'],

  // Umbrales estándar
  venueSizeThresholds: {
    small: 500,
    medium: 2000,
    large: 5000,
  },

  // No necesita re-scraping inicialmente
  needsRescraping: false,

  // Opcional
  updatedBy: undefined,
};
