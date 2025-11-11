/**
 * EventBusinessRules
 *
 * Clase centralizada que contiene todas las reglas de negocio para validar,
 * normalizar y deduplicar eventos.
 *
 * Responsabilidades:
 * - Validar campos requeridos
 * - Validar fechas (rango permitido)
 * - Validar ubicación
 * - Validar contra preferencias globales
 * - Normalizar datos (ciudad, país, categoría)
 * - Detectar duplicados (fuzzy matching)
 *
 * @module Domain/Services
 */

import { compareTwoStrings } from 'string-similarity';
import { Event, EventCategory } from '../entities/Event';
import { PreferencesService, ValidationResult } from './PreferencesService';

/**
 * Configuración de business rules (cargada de config/business-rules.json)
 */
export interface BusinessRulesConfig {
  dateRules: {
    minDaysInFuture: number; // Ej: -1 (permite eventos pasados hasta 1 día)
    maxDaysInFuture: number; // Ej: 365 (solo eventos del próximo año)
    allowPastEvents: boolean;
  };
  locationRules: {
    requiredLocation: boolean; // Si city/country son obligatorios
  };
  contentRules: {
    minTitleLength: number; // Ej: 3
    requiredFields: string[]; // Ej: ["title", "date", "venue"]
  };
  duplicateRules: {
    matchFields: string[]; // Campos a comparar
    fuzzyMatchThreshold: number; // 0-1, ej: 0.85 (85% similar)
    dateToleranceHours: number; // Ej: 24 (tolerancia de 24 horas)
  };
}

/**
 * Configuración por defecto
 */
export const DEFAULT_BUSINESS_RULES: BusinessRulesConfig = {
  dateRules: {
    minDaysInFuture: -1, // Permite eventos pasados hasta 1 día atrás
    maxDaysInFuture: 365, // Solo eventos del próximo año
    allowPastEvents: true,
  },
  locationRules: {
    requiredLocation: true, // Ciudad y país son obligatorios
  },
  contentRules: {
    minTitleLength: 3,
    requiredFields: ['title', 'date'], // Mínimos requeridos
  },
  duplicateRules: {
    matchFields: ['title', 'date', 'venueName'],
    fuzzyMatchThreshold: 0.85,
    dateToleranceHours: 24,
  },
};

export class EventBusinessRules {
  constructor(
    private readonly config: BusinessRulesConfig,
    private readonly preferencesService: PreferencesService
  ) {}

  /**
   * Valida si un evento es aceptable según todas las reglas de negocio
   *
   * @param event - Evento a validar
   * @returns ValidationResult indicando si es válido y razón si no lo es
   */
  async isAcceptable(event: Event): Promise<ValidationResult> {
    // 1. Validar campos requeridos
    const requiredValidation = this.validateRequiredFields(event);
    if (!requiredValidation.valid) {
      return requiredValidation;
    }

    // 2. Validar fechas
    const dateValidation = this.validateDate(event);
    if (!dateValidation.valid) {
      return dateValidation;
    }

    // 3. Validar ubicación
    const locationValidation = this.validateLocation(event);
    if (!locationValidation.valid) {
      return locationValidation;
    }

    // 4. Validar contra preferencias globales
    const preferencesValidation =
      await this.preferencesService.shouldAcceptEvent(event);
    if (!preferencesValidation.valid) {
      return preferencesValidation;
    }

    // Todas las validaciones pasaron
    return { valid: true };
  }

  /**
   * Valida campos requeridos según configuración
   */
  private validateRequiredFields(event: Event): ValidationResult {
    const { requiredFields, minTitleLength } = this.config.contentRules;

    for (const field of requiredFields) {
      const value = (event as Record<string, unknown>)[field];

      if (value === undefined || value === null || value === '') {
        return {
          valid: false,
          reason: `Campo requerido faltante: ${field}`,
          field,
        };
      }
    }

    // Validar longitud mínima del título
    if (event.title && event.title.length < minTitleLength) {
      return {
        valid: false,
        reason: `Título muy corto (mínimo ${minTitleLength} caracteres)`,
        field: 'title',
      };
    }

    return { valid: true };
  }

  /**
   * Valida que la fecha del evento esté en el rango permitido
   */
  private validateDate(event: Event): ValidationResult {
    const { minDaysInFuture, maxDaysInFuture, allowPastEvents } =
      this.config.dateRules;

    const now = new Date();
    const eventDate = new Date(event.date);
    const diffInDays = Math.floor(
      (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Evento muy en el pasado
    if (diffInDays < minDaysInFuture) {
      return {
        valid: false,
        reason: `Evento muy en el pasado (${Math.abs(diffInDays)} días atrás)`,
        field: 'date',
      };
    }

    // Evento muy en el futuro
    if (diffInDays > maxDaysInFuture) {
      return {
        valid: false,
        reason: `Evento muy lejano (${diffInDays} días en el futuro)`,
        field: 'date',
      };
    }

    // Eventos pasados no permitidos (si allowPastEvents = false)
    if (!allowPastEvents && diffInDays < 0) {
      return {
        valid: false,
        reason: 'Eventos pasados no permitidos',
        field: 'date',
      };
    }

    return { valid: true };
  }

  /**
   * Valida que el evento tenga ubicación si es requerido
   */
  private validateLocation(event: Event): ValidationResult {
    if (!this.config.locationRules.requiredLocation) {
      return { valid: true };
    }

    if (!event.city || event.city.trim() === '') {
      return {
        valid: false,
        reason: 'Ciudad es requerida',
        field: 'city',
      };
    }

    if (!event.country || event.country.trim() === '') {
      return {
        valid: false,
        reason: 'País es requerido',
        field: 'country',
      };
    }

    return { valid: true };
  }

  /**
   * Normaliza un evento (ciudad, país, categoría, etc.)
   *
   * @param event - Evento a normalizar
   * @returns Evento normalizado
   */
  normalize(event: Event): Event {
    return {
      ...event,
      // Normalizar ciudad: primera letra mayúscula
      city: this.normalizeCity(event.city),

      // Normalizar país: uppercase (código ISO)
      country: this.normalizeCountry(event.country),

      // Normalizar categoría
      category: this.normalizeCategory(event.category),

      // Trim title y description
      title: event.title?.trim() || '',
      description: event.description?.trim(),
    };
  }

  /**
   * Normaliza el nombre de la ciudad
   * Ej: "buenos aires" → "Buenos Aires"
   */
  private normalizeCity(city: string): string {
    if (!city) return '';

    return city
      .trim() // Eliminar espacios al principio y final
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Normaliza el código de país a ISO-2
   * Ej: "argentina" → "AR", "ar" → "AR"
   */
  private normalizeCountry(country: string): string {
    if (!country) return '';

    // Si ya es un código ISO (2 letras), uppercase
    if (country.length === 2) {
      return country.toUpperCase();
    }

    // Mapeo de nombres comunes a códigos ISO
    const countryMap: Record<string, string> = {
      argentina: 'AR',
      uruguay: 'UY',
      chile: 'CL',
      brasil: 'BR',
      brazil: 'BR',
      paraguay: 'PY',
      bolivia: 'BO',
      peru: 'PE',
      perú: 'PE',
      colombia: 'CO',
      ecuador: 'EC',
      venezuela: 'VE',
    };

    const normalized = country.toLowerCase().trim();
    return countryMap[normalized] || country.toUpperCase();
  }

  /**
   * Normaliza la categoría del evento
   */
  private normalizeCategory(category: string): EventCategory {
    if (!category) return 'Otro';

    const normalized = category.toLowerCase().trim();

    // Mapeo de variaciones comunes
    const categoryMap: Record<string, EventCategory> = {
      concierto: 'Concierto',
      concert: 'Concierto',
      show: 'Concierto',
      festival: 'Festival',
      fest: 'Festival',
      teatro: 'Teatro',
      theater: 'Teatro',
      theatre: 'Teatro',
      'stand-up': 'Stand-up',
      standup: 'Stand-up',
      comedy: 'Stand-up',
      comedia: 'Stand-up',
      opera: 'Ópera',
      ópera: 'Ópera',
      ballet: 'Ballet',
    };

    return categoryMap[normalized] || 'Otro';
  }

  /**
   * Detecta si dos eventos son duplicados usando fuzzy matching
   *
   * Estrategia:
   * 1. Fecha similar (tolerancia configurable)
   * 2. Título similar (string similarity)
   * 3. Venue similar (opcional)
   *
   * @param incoming - Evento entrante
   * @param existing - Evento existente en BD
   * @returns true si son duplicados
   */
  isDuplicate(incoming: Event, existing: Event): boolean {
    const { dateToleranceHours, fuzzyMatchThreshold } =
      this.config.duplicateRules;

    // 1. Validar fecha similar
    const hoursDiff = Math.abs(
      (new Date(incoming.date).getTime() - new Date(existing.date).getTime()) /
        (1000 * 60 * 60)
    );

    if (hoursDiff > dateToleranceHours) {
      return false; // Fechas muy diferentes
    }

    // 2. Validar título similar (fuzzy matching)
    const titleSimilarity = this.calculateStringSimilarity(
      incoming.title.toLowerCase(),
      existing.title.toLowerCase()
    );

    if (titleSimilarity < fuzzyMatchThreshold) {
      return false; // Títulos muy diferentes
    }

    // 3. Validar venue similar (si ambos tienen venue)
    if (incoming.venueName && existing.venueName) {
      const venueSimilarity = this.calculateStringSimilarity(
        incoming.venueName.toLowerCase(),
        existing.venueName.toLowerCase()
      );

      if (venueSimilarity < 0.8) {
        return false; // Venues muy diferentes
      }
    }

    // Suficientemente similar → es duplicado
    return true;
  }

  /**
   * Calcula similaridad entre dos strings usando string-similarity library
   * (algoritmo Dice Coefficient)
   *
   * @returns Valor entre 0 y 1 (1 = idénticos, 0 = totalmente diferentes)
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    return compareTwoStrings(str1, str2);
  }

  /**
   * Determina si un evento entrante debe actualizar uno existente
   *
   * @param incoming - Evento entrante
   * @param existing - Evento existente
   * @returns true si debe actualizar
   */
  shouldUpdate(incoming: Event, existing: Event): boolean {
    // Actualizar si el evento entrante:
    // 1. Tiene más información (descripción más larga, imagen, etc.)
    // 2. Proviene de una fuente más confiable (ej: API oficial vs scraper)
    // 3. Tiene precio cuando el existente no tiene

    // Criterio 1: Descripción más completa
    const incomingDescLength = incoming.description?.length || 0;
    const existingDescLength = existing.description?.length || 0;

    if (incomingDescLength > existingDescLength * 1.5) {
      return true; // 50% más largo
    }

    // Criterio 2: Tiene imagen cuando el existente no tiene
    if (incoming.imageUrl && !existing.imageUrl) {
      return true;
    }

    // Criterio 3: Tiene precio cuando el existente no tiene
    if (incoming.price && !existing.price) {
      return true;
    }

    // Criterio 4: Fuente más confiable (APIs > scrapers)
    const sourceReliability: Record<string, number> = {
      ticketmaster: 10,
      eventbrite: 9,
      spotify: 8,
      scraper_local: 5,
      file: 3,
    };

    const incomingReliability = sourceReliability[incoming.source] || 1;
    const existingReliability = sourceReliability[existing.source] || 1;

    if (incomingReliability > existingReliability) {
      return true;
    }

    // No actualizar
    return false;
  }
}
