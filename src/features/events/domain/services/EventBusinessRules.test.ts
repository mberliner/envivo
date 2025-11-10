/**
 * EventBusinessRules Tests
 *
 * Tests completos de reglas de negocio usando fixtures (sin API)
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { EventBusinessRules, DEFAULT_BUSINESS_RULES } from './EventBusinessRules';
import { PreferencesService } from './PreferencesService';
import { Event } from '../entities/Event';
import { PrismaPreferencesRepository } from '../../data/repositories/PrismaPreferencesRepository';

// Mock de PreferencesService
const mockPreferencesService = {
  shouldAcceptEvent: vi.fn().mockResolvedValue({ valid: true }),
  applyFilters: vi.fn(),
  savePreferences: vi.fn(),
  getPreferences: vi.fn(),
} as unknown as PreferencesService;

describe('EventBusinessRules', () => {
  let rules: EventBusinessRules;

  beforeEach(() => {
    rules = new EventBusinessRules(DEFAULT_BUSINESS_RULES, mockPreferencesService);
    vi.clearAllMocks();
  });

  // ========================================
  // FIXTURES - Eventos de prueba
  // ========================================

  const createValidEvent = (overrides?: Partial<Event>): Event => {
    // Crear fecha en el futuro (30 días desde hoy)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    return {
      id: 'evt-001',
      title: 'Metallica en Buenos Aires',
      date: futureDate,
      venueName: 'Estadio River Plate',
      city: 'Buenos Aires',
      country: 'AR',
      category: 'Concierto',
      imageUrl: 'https://example.com/metallica.jpg',
      ticketUrl: 'https://ticketmaster.com/metallica',
      source: 'ticketmaster',
      price: 15000,
      currency: 'ARS',
      description: 'Concierto de Metallica en Argentina',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  };

  // ========================================
  // TESTS: Validación de Campos Requeridos
  // ========================================

  describe('validateRequiredFields', () => {
    test('acepta evento con todos los campos requeridos', async () => {
      const event = createValidEvent();
      const result = await rules.isAcceptable(event);
      expect(result.valid).toBe(true);
    });

    test('rechaza evento sin título', async () => {
      const event = createValidEvent({ title: '' });
      const result = await rules.isAcceptable(event);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Campo requerido faltante: title');
    });

    test('rechaza evento con título muy corto', async () => {
      const event = createValidEvent({ title: 'AB' }); // Mínimo 3 caracteres
      const result = await rules.isAcceptable(event);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Título muy corto');
    });

    test('rechaza evento sin fecha', async () => {
      const event = createValidEvent({ date: null as any });
      const result = await rules.isAcceptable(event);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Campo requerido faltante: date');
    });
  });

  // ========================================
  // TESTS: Validación de Fechas
  // ========================================

  describe('validateDate', () => {
    test('acepta evento en el futuro cercano', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30); // +30 días
      const event = createValidEvent({ date: futureDate });
      const result = await rules.isAcceptable(event);
      expect(result.valid).toBe(true);
    });

    test('acepta evento pasado reciente (dentro de tolerancia)', async () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 12); // -12 horas (< 1 día)
      const event = createValidEvent({ date: pastDate });
      const result = await rules.isAcceptable(event);
      expect(result.valid).toBe(true);
    });

    test('rechaza evento muy en el pasado', async () => {
      const veryPastDate = new Date();
      veryPastDate.setDate(veryPastDate.getDate() - 10); // -10 días
      const event = createValidEvent({ date: veryPastDate });
      const result = await rules.isAcceptable(event);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('muy en el pasado');
    });

    test('rechaza evento muy en el futuro (>365 días)', async () => {
      const veryFutureDate = new Date();
      veryFutureDate.setDate(veryFutureDate.getDate() + 400); // +400 días
      const event = createValidEvent({ date: veryFutureDate });
      const result = await rules.isAcceptable(event);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('muy lejano');
    });
  });

  // ========================================
  // TESTS: Validación de Ubicación
  // ========================================

  describe('validateLocation', () => {
    test('acepta evento con ciudad y país', async () => {
      const event = createValidEvent({ city: 'Buenos Aires', country: 'AR' });
      const result = await rules.isAcceptable(event);
      expect(result.valid).toBe(true);
    });

    test('rechaza evento sin ciudad', async () => {
      const event = createValidEvent({ city: '' });
      const result = await rules.isAcceptable(event);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Ciudad es requerida');
    });

    test('rechaza evento sin país', async () => {
      const event = createValidEvent({ country: '' });
      const result = await rules.isAcceptable(event);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('País es requerido');
    });
  });

  // ========================================
  // TESTS: Normalización
  // ========================================

  describe('normalize', () => {
    test('normaliza ciudad a Title Case', () => {
      const event = createValidEvent({ city: 'buenos aires' });
      const normalized = rules.normalize(event);
      expect(normalized.city).toBe('Buenos Aires');
    });

    test('normaliza país a código ISO-2', () => {
      const event1 = createValidEvent({ country: 'argentina' });
      const event2 = createValidEvent({ country: 'ar' });
      const event3 = createValidEvent({ country: 'AR' });

      expect(rules.normalize(event1).country).toBe('AR');
      expect(rules.normalize(event2).country).toBe('AR');
      expect(rules.normalize(event3).country).toBe('AR');
    });

    test('normaliza país Uruguay correctamente', () => {
      const event = createValidEvent({ country: 'uruguay' });
      expect(rules.normalize(event).country).toBe('UY');
    });

    test('normaliza categoría a formato estándar', () => {
      expect(rules.normalize(createValidEvent({ category: 'concert' as any })).category).toBe('Concierto');
      expect(rules.normalize(createValidEvent({ category: 'festival' as any })).category).toBe('Festival');
      expect(rules.normalize(createValidEvent({ category: 'teatro' as any })).category).toBe('Teatro');
      expect(rules.normalize(createValidEvent({ category: 'stand-up' as any })).category).toBe('Stand-up');
      expect(rules.normalize(createValidEvent({ category: 'opera' as any })).category).toBe('Ópera');
    });

    test('normaliza categoría desconocida a "Otro"', () => {
      const event = createValidEvent({ category: 'evento_raro' as any });
      expect(rules.normalize(event).category).toBe('Otro');
    });

    test('hace trim de título y descripción', () => {
      const event = createValidEvent({
        title: '  Metallica  ',
        description: '  Gran concierto  ',
      });
      const normalized = rules.normalize(event);
      expect(normalized.title).toBe('Metallica');
      expect(normalized.description).toBe('Gran concierto');
    });
  });

  // ========================================
  // TESTS: Deduplicación (Fuzzy Matching)
  // ========================================

  describe('isDuplicate', () => {
    test('detecta duplicado exacto', () => {
      const event1 = createValidEvent();
      const event2 = createValidEvent();
      expect(rules.isDuplicate(event1, event2)).toBe(true);
    });

    test('detecta duplicado con título similar (>85%)', () => {
      const event1 = createValidEvent({ title: 'Metallica - World Tour 2025' });
      const event2 = createValidEvent({ title: 'Metallica World Tour 2025' }); // Solo difiere en el guión
      expect(rules.isDuplicate(event1, event2)).toBe(true);
    });

    test('NO detecta duplicado si título muy diferente (<85%)', () => {
      const event1 = createValidEvent({ title: 'Metallica en Buenos Aires' });
      const event2 = createValidEvent({ title: 'Iron Maiden en Buenos Aires' });
      expect(rules.isDuplicate(event1, event2)).toBe(false);
    });

    test('NO detecta duplicado si fechas muy diferentes (>24h)', () => {
      const event1 = createValidEvent({ date: new Date('2025-06-15T20:00:00') });
      const event2 = createValidEvent({ date: new Date('2025-06-20T20:00:00') });
      expect(rules.isDuplicate(event1, event2)).toBe(false);
    });

    test('detecta duplicado si fechas similares (<24h)', () => {
      const event1 = createValidEvent({ date: new Date('2025-06-15T20:00:00') });
      const event2 = createValidEvent({ date: new Date('2025-06-15T21:00:00') }); // +1 hora
      expect(rules.isDuplicate(event1, event2)).toBe(true);
    });

    test('NO detecta duplicado si venues muy diferentes', () => {
      const event1 = createValidEvent({ venueName: 'Estadio River Plate' });
      const event2 = createValidEvent({ venueName: 'Luna Park' });
      expect(rules.isDuplicate(event1, event2)).toBe(false);
    });

    test('detecta duplicado entre diferentes fuentes (cross-source)', () => {
      const event1 = createValidEvent({
        source: 'ticketmaster',
        title: 'Metallica en Buenos Aires',
      });
      const event2 = createValidEvent({
        source: 'eventbrite',
        title: 'Metallica en Buenos Aires',
      });
      expect(rules.isDuplicate(event1, event2)).toBe(true);
    });
  });

  // ========================================
  // TESTS: shouldUpdate (Cuándo actualizar)
  // ========================================

  describe('shouldUpdate', () => {
    test('actualiza si evento entrante tiene descripción más larga', () => {
      const incoming = createValidEvent({
        description: 'Descripción muy muy muy muy larga con muchos detalles del evento y más información útil',
      });
      const existing = createValidEvent({
        description: 'Descripción corta',
      });
      expect(rules.shouldUpdate(incoming, existing)).toBe(true);
    });

    test('actualiza si evento entrante tiene imagen y el existente no', () => {
      const incoming = createValidEvent({ imageUrl: 'https://example.com/image.jpg' });
      const existing = createValidEvent({ imageUrl: undefined });
      expect(rules.shouldUpdate(incoming, existing)).toBe(true);
    });

    test('actualiza si evento entrante tiene precio y el existente no', () => {
      const incoming = createValidEvent({ price: 15000 });
      const existing = createValidEvent({ price: undefined });
      expect(rules.shouldUpdate(incoming, existing)).toBe(true);
    });

    test('actualiza si evento entrante proviene de fuente más confiable', () => {
      const incoming = createValidEvent({ source: 'ticketmaster' }); // Confiabilidad 10
      const existing = createValidEvent({ source: 'scraper_local' }); // Confiabilidad 5
      expect(rules.shouldUpdate(incoming, existing)).toBe(true);
    });

    test('NO actualiza si evento entrante es similar al existente', () => {
      const incoming = createValidEvent();
      const existing = createValidEvent();
      expect(rules.shouldUpdate(incoming, existing)).toBe(false);
    });

    test('NO actualiza si evento entrante proviene de fuente menos confiable', () => {
      const incoming = createValidEvent({ source: 'scraper_local' }); // Confiabilidad 5
      const existing = createValidEvent({ source: 'ticketmaster' }); // Confiabilidad 10
      expect(rules.shouldUpdate(incoming, existing)).toBe(false);
    });
  });

  // ========================================
  // TESTS: Integración con PreferencesService
  // ========================================

  describe('isAcceptable - Integration with Preferences', () => {
    test('rechaza evento si no pasa filtros de preferencias', async () => {
      mockPreferencesService.shouldAcceptEvent = vi.fn().mockResolvedValue({
        valid: false,
        reason: 'Categoría no permitida',
      });

      const event = createValidEvent();
      const result = await rules.isAcceptable(event);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Categoría no permitida');
    });

    test('acepta evento si pasa todas las validaciones y preferencias', async () => {
      mockPreferencesService.shouldAcceptEvent = vi.fn().mockResolvedValue({ valid: true });

      const event = createValidEvent();
      const result = await rules.isAcceptable(event);

      expect(result.valid).toBe(true);
      expect(mockPreferencesService.shouldAcceptEvent).toHaveBeenCalledWith(event);
    });
  });

  // ========================================
  // TESTS: Casos Edge (Edge Cases)
  // ========================================

  describe('Edge Cases', () => {
    test('maneja eventos sin descripción', () => {
      const event = createValidEvent({ description: undefined });
      const normalized = rules.normalize(event);
      expect(normalized.description).toBeUndefined();
    });

    test('maneja eventos sin venueName en isDuplicate', () => {
      const event1 = createValidEvent({ venueName: null as any });
      const event2 = createValidEvent({ venueName: null as any });
      // Debería comparar solo por título y fecha
      expect(rules.isDuplicate(event1, event2)).toBe(true);
    });

    test('maneja país desconocido en normalize', () => {
      const event = createValidEvent({ country: 'UNKNOWN_COUNTRY' });
      const normalized = rules.normalize(event);
      expect(normalized.country).toBe('UNKNOWN_COUNTRY'); // Mantiene uppercase
    });

    test('maneja strings vacíos en calculateStringSimilarity', () => {
      const event1 = createValidEvent({ title: '' });
      const event2 = createValidEvent({ title: 'Metallica' });
      // No debería crashear
      expect(() => rules.isDuplicate(event1, event2)).not.toThrow();
    });
  });

  // ========================================
  // TESTS: Escenarios Reales (Real-World)
  // ========================================

  describe('Real-World Scenarios', () => {
    test('Scenario: Mismo evento en Ticketmaster y Eventbrite', () => {
      const tmEvent = createValidEvent({
        id: 'tm-001',
        source: 'ticketmaster',
        title: 'Metallica - World Tour 2025',
        venueName: 'Estadio River Plate',
        date: new Date('2025-06-15T20:00:00'),
      });

      const ebEvent = createValidEvent({
        id: 'eb-001',
        source: 'eventbrite',
        title: 'Metallica World Tour 2025',
        venueName: 'Estadio River Plate',
        date: new Date('2025-06-15T20:30:00'), // 30 min diferencia
      });

      // Deben detectarse como duplicados
      expect(rules.isDuplicate(tmEvent, ebEvent)).toBe(true);

      // Ticketmaster (más confiable) debe actualizar Eventbrite
      expect(rules.shouldUpdate(tmEvent, ebEvent)).toBe(true);
    });

    test('Scenario: Eventos similares pero diferentes artistas', () => {
      const event1 = createValidEvent({
        title: 'Metallica en Buenos Aires',
        date: new Date('2025-06-15T20:00:00'),
      });

      const event2 = createValidEvent({
        title: 'Iron Maiden en Buenos Aires',
        date: new Date('2025-06-15T20:00:00'),
      });

      // NO deben detectarse como duplicados (artistas diferentes)
      expect(rules.isDuplicate(event1, event2)).toBe(false);
    });

    test('Scenario: Normalización de datos scrapeados', () => {
      const rawEvent = createValidEvent({
        city: 'BUENOS AIRES  ', // Uppercase + espacios
        country: 'argentina', // Nombre completo
        category: 'concert' as any, // Inglés
        title: '  Metallica en Argentina  ', // Espacios
      });

      const normalized = rules.normalize(rawEvent);

      expect(normalized.city).toBe('Buenos Aires');
      expect(normalized.country).toBe('AR');
      expect(normalized.category).toBe('Concierto');
      expect(normalized.title).toBe('Metallica en Argentina');
    });
  });
});
