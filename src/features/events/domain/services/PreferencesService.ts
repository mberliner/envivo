/**
 * PreferencesService
 *
 * Servicio de dominio que maneja la lógica de negocio relacionada con
 * las preferencias globales del sistema.
 *
 * Responsabilidades:
 * - Obtener preferencias con caché en memoria
 * - Actualizar preferencias e invalidar caché
 * - Validar eventos contra preferencias
 * - Calcular tamaño de venue según umbrales
 *
 * @module Domain/Services
 */

import { Event } from '../entities/Event';
import {
  GlobalPreferences,
  VenueSize,
} from '../entities/GlobalPreferences';
import { IPreferencesRepository } from '../interfaces/IPreferencesRepository';

/**
 * Resultado de validación de un evento contra preferencias
 */
export interface ValidationResult {
  valid: boolean;
  reason?: string;
  field?: string;
}

export class PreferencesService {
  private cache: GlobalPreferences | null = null;
  private cacheExpiry: Date | null = null;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

  constructor(private readonly repository: IPreferencesRepository) {}

  /**
   * Obtiene las preferencias globales actuales con caché
   * @returns Preferencias globales (nunca null, usa DEFAULT_PREFERENCES si no existen)
   */
  async getActivePreferences(): Promise<GlobalPreferences> {
    // Verificar caché válido
    if (this.cache && this.cacheExpiry && new Date() < this.cacheExpiry) {
      return this.cache;
    }

    // Obtener de repositorio
    let preferences = await this.repository.get();

    // Si no existen, inicializar con valores por defecto
    if (!preferences) {
      preferences = await this.repository.initialize();
    }

    // Actualizar caché
    this.cache = preferences;
    this.cacheExpiry = new Date(Date.now() + this.CACHE_TTL_MS);

    return preferences;
  }

  /**
   * Actualiza las preferencias globales
   * Invalida el caché y marca needsRescraping = true
   *
   * @param updates - Preferencias a actualizar (parcial)
   * @returns Preferencias actualizadas
   */
  async updatePreferences(
    updates: Partial<GlobalPreferences>
  ): Promise<GlobalPreferences> {
    // Marcar que se necesita re-scraping
    const updatesWithFlag = {
      ...updates,
      needsRescraping: true,
    };

    const updated = await this.repository.update(updatesWithFlag);

    // Invalidar caché
    this.invalidateCache();

    return updated;
  }

  /**
   * Verifica si un evento debe ser aceptado según las preferencias globales
   *
   * @param event - Evento a validar
   * @param preferences - Preferencias (opcional, si no se pasa usa getActivePreferences)
   * @returns ValidationResult indicando si es válido y razón si no lo es
   */
  async shouldAcceptEvent(
    event: Event,
    preferences?: GlobalPreferences
  ): Promise<ValidationResult> {
    const prefs = preferences || (await this.getActivePreferences());

    // Validar país
    if (prefs.allowedCountries.length > 0) {
      if (!prefs.allowedCountries.includes(event.country)) {
        return {
          valid: false,
          reason: `País no permitido: ${event.country}`,
          field: 'country',
        };
      }
    }

    // Validar ciudad (si está especificada)
    if (prefs.allowedCities.length > 0 && event.city) {
      const cityMatch = prefs.allowedCities.some(
        (allowedCity) =>
          allowedCity.toLowerCase() === event.city.toLowerCase()
      );

      if (!cityMatch) {
        return {
          valid: false,
          reason: `Ciudad no permitida: ${event.city}`,
          field: 'city',
        };
      }
    }

    // Validar género (si está especificado)
    if (event.genre) {
      // Lista negra: si está bloqueado, rechazar
      if (prefs.blockedGenres.length > 0) {
        if (prefs.blockedGenres.includes(event.genre)) {
          return {
            valid: false,
            reason: `Género bloqueado: ${event.genre}`,
            field: 'genre',
          };
        }
      }

      // Lista blanca: si hay géneros permitidos, debe estar en la lista
      if (prefs.allowedGenres.length > 0) {
        if (!prefs.allowedGenres.includes(event.genre)) {
          return {
            valid: false,
            reason: `Género no permitido: ${event.genre}`,
            field: 'genre',
          };
        }
      }
    }

    // Validar categoría
    if (prefs.allowedCategories.length > 0 && event.category) {
      if (!prefs.allowedCategories.includes(event.category)) {
        return {
          valid: false,
          reason: `Categoría no permitida: ${event.category}`,
          field: 'category',
        };
      }
    }

    // Validar capacidad de venue (solo si el evento tiene capacidad)
    if (prefs.allowedVenueSizes.length > 0 && event.venueCapacity != null) {
      const venueSize = this.calculateVenueSize(
        event.venueCapacity,
        prefs.venueSizeThresholds
      );

      if (!prefs.allowedVenueSizes.includes(venueSize)) {
        return {
          valid: false,
          reason: `Capacidad de venue no permitida: ${venueSize} (${event.venueCapacity} personas)`,
          field: 'venueCapacity',
        };
      }
    }

    // Todas las validaciones pasaron
    return { valid: true };
  }

  /**
   * Calcula el tamaño de un venue según su capacidad y los umbrales configurados
   *
   * @param capacity - Capacidad del venue en personas
   * @param thresholds - Umbrales de capacidad
   * @returns Tamaño del venue (small, medium, large)
   */
  calculateVenueSize(
    capacity: number,
    thresholds: GlobalPreferences['venueSizeThresholds']
  ): VenueSize {
    if (capacity < thresholds.small) {
      return 'small';
    }
    if (capacity < thresholds.medium) {
      return 'medium';
    }
    return 'large';
  }

  /**
   * Verifica si se necesita re-scraping
   * @returns true si needsRescraping === true
   */
  async needsRescraping(): Promise<boolean> {
    return this.repository.needsRescraping();
  }

  /**
   * Marca que el re-scraping fue completado
   */
  async markRescrapingDone(): Promise<void> {
    await this.repository.markRescrapingDone();

    // Invalidar caché para forzar recarga
    this.invalidateCache();
  }

  /**
   * Invalida el caché de preferencias
   * Útil después de actualizaciones o para testing
   */
  invalidateCache(): void {
    this.cache = null;
    this.cacheExpiry = null;
  }

  /**
   * Versión síncrona de shouldAcceptEvent
   * Útil cuando ya tienes las preferencias en memoria
   *
   * @param event - Evento a validar
   * @param preferences - Preferencias globales
   * @returns ValidationResult
   */
  shouldAcceptEventSync(
    event: Event,
    preferences: GlobalPreferences
  ): ValidationResult {
    // Validar país
    if (preferences.allowedCountries.length > 0) {
      if (!preferences.allowedCountries.includes(event.country)) {
        return {
          valid: false,
          reason: `País no permitido: ${event.country}`,
          field: 'country',
        };
      }
    }

    // Validar ciudad
    if (preferences.allowedCities.length > 0 && event.city) {
      const cityMatch = preferences.allowedCities.some(
        (allowedCity) =>
          allowedCity.toLowerCase() === event.city.toLowerCase()
      );

      if (!cityMatch) {
        return {
          valid: false,
          reason: `Ciudad no permitida: ${event.city}`,
          field: 'city',
        };
      }
    }

    // Validar género
    if (event.genre) {
      if (preferences.blockedGenres.includes(event.genre)) {
        return {
          valid: false,
          reason: `Género bloqueado: ${event.genre}`,
          field: 'genre',
        };
      }

      if (preferences.allowedGenres.length > 0) {
        if (!preferences.allowedGenres.includes(event.genre)) {
          return {
            valid: false,
            reason: `Género no permitido: ${event.genre}`,
            field: 'genre',
          };
        }
      }
    }

    // Validar categoría
    if (preferences.allowedCategories.length > 0 && event.category) {
      if (!preferences.allowedCategories.includes(event.category)) {
        return {
          valid: false,
          reason: `Categoría no permitida: ${event.category}`,
          field: 'category',
        };
        }
    }

    // Validar capacidad de venue
    if (
      preferences.allowedVenueSizes.length > 0 &&
      event.venueCapacity != null
    ) {
      const venueSize = this.calculateVenueSize(
        event.venueCapacity,
        preferences.venueSizeThresholds
      );

      if (!preferences.allowedVenueSizes.includes(venueSize)) {
        return {
          valid: false,
          reason: `Capacidad de venue no permitida: ${venueSize}`,
          field: 'venueCapacity',
        };
      }
    }

    return { valid: true };
  }
}
