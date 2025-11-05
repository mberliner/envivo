/**
 * EJEMPLO COMPLETO: Business Rules - Validación y Deduplicación
 *
 * Este archivo muestra cómo implementar:
 * 1. EventBusinessRules centralizado
 * 2. Validación de fechas, ubicación, contenido
 * 3. Detección de duplicados con fuzzy matching
 * 4. Normalización de datos
 * 5. Configuración externa (JSON)
 *
 * NOTA: Este es un archivo de EJEMPLO. Copiar código a /src durante implementación.
 */

import { compareTwoStrings } from 'string-similarity';
import { differenceInHours, differenceInDays, isAfter, isBefore } from 'date-fns';

// ============================================
// TYPES
// ============================================

interface Event {
  id?: string;
  title: string;
  date: Date;
  endDate?: Date;
  venue?: string;
  city?: string;
  country?: string;
  category?: string;
  genre?: string;
  description?: string;
  price?: number;
  source: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ValidationResult {
  valid: boolean;
  reason?: string;
  field?: string;
}

interface BusinessRulesConfig {
  dateRules: {
    minDaysInFuture: number;
    maxDaysInFuture: number;
    allowPastEvents: boolean;
  };
  locationRules: {
    allowedCountries?: string[];
    allowedCities?: string[];
    requiredLocation: boolean;
  };
  contentRules: {
    minTitleLength: number;
    maxTitleLength?: number;
    requiredFields: string[];
    allowedCategories?: string[];
    blockedGenres?: string[];
  };
  duplicateRules: {
    matchFields: string[];
    fuzzyMatchThreshold: number;
    dateToleranceHours: number;
  };
  updateRules: {
    updateIfNewer: boolean;
    mergeFields: string[];
  };
}

// ============================================
// INTERFACE
// ============================================

export interface IEventBusinessRules {
  isAcceptable(event: Event): ValidationResult;
  isDuplicate(incoming: Event, existing: Event): boolean;
  shouldUpdate(incoming: Event, existing: Event): boolean;
  normalize(event: Event): Event;
}

// ============================================
// IMPLEMENTATION
// ============================================

export class EventBusinessRules implements IEventBusinessRules {
  constructor(private config: BusinessRulesConfig) {}

  /**
   * Valida si un evento es aceptable según las reglas de negocio
   */
  isAcceptable(event: Event): ValidationResult {
    // 1. Validar campos requeridos
    const requiredValidation = this.validateRequiredFields(event);
    if (!requiredValidation.valid) return requiredValidation;

    // 2. Validar fechas
    const dateValidation = this.validateDate(event);
    if (!dateValidation.valid) return dateValidation;

    // 3. Validar ubicación
    const locationValidation = this.validateLocation(event);
    if (!locationValidation.valid) return locationValidation;

    // 4. Validar contenido
    const contentValidation = this.validateContent(event);
    if (!contentValidation.valid) return contentValidation;

    return { valid: true };
  }

  /**
   * Detecta si dos eventos son duplicados
   */
  isDuplicate(incoming: Event, existing: Event): boolean {
    const { fuzzyMatchThreshold, dateToleranceHours, matchFields } = this.config.duplicateRules;

    // 1. Fecha similar (tolerancia configurable)
    const hoursDiff = Math.abs(differenceInHours(incoming.date, existing.date));
    if (hoursDiff > dateToleranceHours) {
      return false;
    }

    // 2. Título similar (fuzzy matching)
    if (matchFields.includes('title')) {
      const titleSimilarity = compareTwoStrings(
        this.normalizeString(incoming.title),
        this.normalizeString(existing.title)
      );

      if (titleSimilarity < fuzzyMatchThreshold) {
        return false;
      }
    }

    // 3. Venue similar (si ambos tienen)
    if (matchFields.includes('venue') && incoming.venue && existing.venue) {
      const venueSimilarity = compareTwoStrings(
        this.normalizeString(incoming.venue),
        this.normalizeString(existing.venue)
      );

      if (venueSimilarity < 0.8) {
        return false;
      }
    }

    // 4. Ciudad debe coincidir
    if (matchFields.includes('city')) {
      if (incoming.city && existing.city) {
        const citySimilarity = compareTwoStrings(
          this.normalizeString(incoming.city),
          this.normalizeString(existing.city)
        );

        if (citySimilarity < 0.9) {
          return false;
        }
      }
    }

    // Si pasó todas las validaciones, es duplicado
    return true;
  }

  /**
   * Decide si un evento existente debe actualizarse con datos nuevos
   */
  shouldUpdate(incoming: Event, existing: Event): boolean {
    const { updateIfNewer } = this.config.updateRules;

    if (!updateIfNewer) {
      return false;
    }

    // Actualizar si el incoming es más reciente
    if (existing.updatedAt && incoming.updatedAt) {
      return isAfter(incoming.updatedAt, existing.updatedAt);
    }

    // Actualizar si viene de fuente más confiable
    const sourcePriority: Record<string, number> = {
      'ticketmaster': 10,
      'eventbrite': 8,
      'local-scraper': 5,
      'file': 1
    };

    const incomingPriority = sourcePriority[incoming.source] || 0;
    const existingPriority = sourcePriority[existing.source] || 0;

    return incomingPriority > existingPriority;
  }

  /**
   * Normaliza un evento antes de guardarlo
   */
  normalize(event: Event): Event {
    return {
      ...event,
      title: this.normalizeString(event.title),
      city: event.city ? this.capitalizeCity(event.city) : undefined,
      country: event.country ? this.normalizeCountry(event.country) : undefined,
      category: event.category ? this.capitalizeString(event.category) : undefined,
      genre: event.genre ? this.capitalizeString(event.genre) : undefined,
      date: typeof event.date === 'string' ? new Date(event.date) : event.date,
      endDate: event.endDate
        ? typeof event.endDate === 'string'
          ? new Date(event.endDate)
          : event.endDate
        : undefined
    };
  }

  // ============================================
  // PRIVATE VALIDATION METHODS
  // ============================================

  private validateRequiredFields(event: Event): ValidationResult {
    const { requiredFields } = this.config.contentRules;

    for (const field of requiredFields) {
      if (!event[field as keyof Event]) {
        return {
          valid: false,
          reason: `Campo requerido faltante: ${field}`,
          field
        };
      }
    }

    return { valid: true };
  }

  private validateDate(event: Event): ValidationResult {
    const { minDaysInFuture, maxDaysInFuture, allowPastEvents } = this.config.dateRules;
    const now = new Date();

    // Verificar que sea una fecha válida
    if (!(event.date instanceof Date) || isNaN(event.date.getTime())) {
      return {
        valid: false,
        reason: 'Fecha inválida',
        field: 'date'
      };
    }

    const daysFromNow = differenceInDays(event.date, now);

    // Fecha pasada
    if (daysFromNow < 0) {
      if (!allowPastEvents) {
        return {
          valid: false,
          reason: 'Eventos pasados no permitidos',
          field: 'date'
        };
      }

      // Si permite pasados, verificar que no sea muy antiguo
      if (Math.abs(daysFromNow) > Math.abs(minDaysInFuture)) {
        return {
          valid: false,
          reason: `Evento demasiado antiguo (>${Math.abs(minDaysInFuture)} días)`,
          field: 'date'
        };
      }
    }

    // Fecha muy lejana en futuro
    if (daysFromNow > maxDaysInFuture) {
      return {
        valid: false,
        reason: `Evento demasiado lejano en el futuro (>${maxDaysInFuture} días)`,
        field: 'date'
      };
    }

    return { valid: true };
  }

  private validateLocation(event: Event): ValidationResult {
    const { allowedCountries, allowedCities, requiredLocation } = this.config.locationRules;

    // Verificar si la ubicación es requerida
    if (requiredLocation) {
      if (!event.city && !event.country) {
        return {
          valid: false,
          reason: 'Ubicación requerida (ciudad o país)',
          field: 'location'
        };
      }
    }

    // Validar país permitido
    if (allowedCountries && event.country) {
      const normalizedCountry = this.normalizeCountry(event.country);
      if (!allowedCountries.includes(normalizedCountry)) {
        return {
          valid: false,
          reason: `País no permitido: ${event.country}`,
          field: 'country'
        };
      }
    }

    // Validar ciudad permitida
    if (allowedCities && event.city) {
      const normalizedCity = this.normalizeString(event.city);
      const allowedCitiesNormalized = allowedCities.map(c => this.normalizeString(c));

      if (!allowedCitiesNormalized.includes(normalizedCity)) {
        return {
          valid: false,
          reason: `Ciudad no permitida: ${event.city}`,
          field: 'city'
        };
      }
    }

    return { valid: true };
  }

  private validateContent(event: Event): ValidationResult {
    const { minTitleLength, maxTitleLength, allowedCategories, blockedGenres } =
      this.config.contentRules;

    // Validar longitud de título
    if (event.title.length < minTitleLength) {
      return {
        valid: false,
        reason: `Título demasiado corto (mínimo ${minTitleLength} caracteres)`,
        field: 'title'
      };
    }

    if (maxTitleLength && event.title.length > maxTitleLength) {
      return {
        valid: false,
        reason: `Título demasiado largo (máximo ${maxTitleLength} caracteres)`,
        field: 'title'
      };
    }

    // Validar categoría permitida
    if (allowedCategories && event.category) {
      if (!allowedCategories.includes(event.category)) {
        return {
          valid: false,
          reason: `Categoría no permitida: ${event.category}`,
          field: 'category'
        };
      }
    }

    // Validar género bloqueado
    if (blockedGenres && event.genre) {
      if (blockedGenres.includes(event.genre)) {
        return {
          valid: false,
          reason: `Género bloqueado: ${event.genre}`,
          field: 'genre'
        };
      }
    }

    return { valid: true };
  }

  // ============================================
  // NORMALIZATION HELPERS
  // ============================================

  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .trim();
  }

  private capitalizeString(str: string): string {
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private capitalizeCity(city: string): string {
    // Buenos Aires, Córdoba, etc.
    return this.capitalizeString(city);
  }

  private normalizeCountry(country: string): string {
    // Convertir nombres completos a códigos ISO
    const countryMap: Record<string, string> = {
      'argentina': 'AR',
      'uruguay': 'UY',
      'chile': 'CL',
      'brasil': 'BR',
      'brazil': 'BR',
      'paraguay': 'PY',
      'bolivia': 'BO',
      'perú': 'PE',
      'peru': 'PE',
      'colombia': 'CO',
      'venezuela': 'VE',
      'ecuador': 'EC'
    };

    const normalized = this.normalizeString(country);
    return countryMap[normalized] || country.toUpperCase();
  }
}

// ============================================
// CONFIGURATION EXAMPLE
// ============================================

/**
 * Configuración de ejemplo (guardar en config/business-rules.json)
 */
export const defaultBusinessRulesConfig: BusinessRulesConfig = {
  dateRules: {
    minDaysInFuture: -1, // Permite eventos hasta 1 día en el pasado
    maxDaysInFuture: 365, // Hasta 1 año en el futuro
    allowPastEvents: true
  },
  locationRules: {
    allowedCountries: ['AR', 'UY', 'CL', 'BR', 'PY'], // Cono Sur
    requiredLocation: true
  },
  contentRules: {
    minTitleLength: 3,
    maxTitleLength: 200,
    requiredFields: ['title', 'date', 'venue'],
    allowedCategories: ['Concierto', 'Festival', 'Teatro', 'Stand-up', 'Opera'],
    blockedGenres: [] // Vacío por defecto, configurar si es necesario
  },
  duplicateRules: {
    matchFields: ['title', 'date', 'venue', 'city'],
    fuzzyMatchThreshold: 0.85, // 85% de similitud en título
    dateToleranceHours: 24 // Eventos dentro de 24 horas se consideran duplicados
  },
  updateRules: {
    updateIfNewer: true,
    mergeFields: ['description', 'imageUrl', 'price'] // Campos a mergear si son mejores
  }
};

// ============================================
// USAGE EXAMPLE
// ============================================

async function exampleUsage() {
  const rules = new EventBusinessRules(defaultBusinessRulesConfig);

  // 1. Validar evento
  const event: Event = {
    title: 'Metallica en Buenos Aires',
    date: new Date('2025-06-15T20:00:00'),
    venue: 'Estadio River Plate',
    city: 'Buenos Aires',
    country: 'Argentina',
    category: 'Concierto',
    source: 'ticketmaster'
  };

  const validation = rules.isAcceptable(event);
  if (!validation.valid) {
    console.error(`❌ Evento rechazado: ${validation.reason}`);
    return;
  }

  // 2. Normalizar evento
  const normalized = rules.normalize(event);
  console.log('✅ Evento normalizado:', normalized);
  // {
  //   title: 'metallica en buenos aires',
  //   city: 'Buenos Aires',
  //   country: 'AR',
  //   category: 'Concierto',
  //   ...
  // }

  // 3. Detectar duplicados
  const existingEvent: Event = {
    title: 'Metallica en Bs As', // Similar pero no exacto
    date: new Date('2025-06-15T21:00:00'), // 1 hora de diferencia
    venue: 'Estadio River Plate',
    city: 'Buenos Aires',
    country: 'AR',
    category: 'Concierto',
    source: 'scraper-local'
  };

  const isDupe = rules.isDuplicate(normalized, existingEvent);
  console.log('Es duplicado?', isDupe); // true

  // 4. Decidir si actualizar
  if (isDupe) {
    const shouldUpdate = rules.shouldUpdate(normalized, existingEvent);
    console.log('Debe actualizar?', shouldUpdate); // true (Ticketmaster > scraper-local)
  }
}

// exampleUsage().catch(console.error);
