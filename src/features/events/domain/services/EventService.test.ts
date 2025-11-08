/**
 * EventService Tests
 *
 * Tests de integración completa: EventService + BusinessRules + Repository
 * Demuestra que Fase 2 funciona sin necesidad de API externa
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { EventService } from './EventService';
import { EventBusinessRules, DEFAULT_BUSINESS_RULES } from './EventBusinessRules';
import { PreferencesService } from './PreferencesService';
import { IEventRepository } from '../interfaces/IEventRepository';
import { Event, RawEvent } from '../entities/Event';

// ========================================
// MOCKS
// ========================================

const mockPreferencesService = {
  shouldAcceptEvent: vi.fn().mockResolvedValue({ valid: true }),
} as unknown as PreferencesService;

const mockRepository: IEventRepository = {
  findAll: vi.fn().mockResolvedValue([]),
  findById: vi.fn().mockResolvedValue(null),
  findByFilters: vi.fn().mockResolvedValue([]),
  upsertMany: vi.fn().mockResolvedValue(0),
  deleteById: vi.fn().mockResolvedValue(undefined),
};

// ========================================
// FIXTURES
// ========================================

const createRawEvent = (overrides?: Partial<RawEvent>): RawEvent => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);

  return {
    title: 'Metallica en Buenos Aires',
    date: futureDate,
    city: 'Buenos Aires',
    country: 'AR',
    category: 'Concierto',
    imageUrl: 'https://example.com/metallica.jpg',
    ticketUrl: 'https://ticketmaster.com/metallica',
    source: 'ticketmaster',
    externalId: 'tm-001',
    description: 'Gran concierto de Metallica',
    venueName: 'Estadio River Plate',
    ...overrides,
  };
};

const createEvent = (overrides?: Partial<Event>): Event => {
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
    externalId: 'tm-001',
    description: 'Gran concierto de Metallica',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
};

describe('EventService', () => {
  let service: EventService;
  let businessRules: EventBusinessRules;

  beforeEach(() => {
    businessRules = new EventBusinessRules(DEFAULT_BUSINESS_RULES, mockPreferencesService);
    service = new EventService(mockRepository, businessRules);
    vi.clearAllMocks();
  });

  // ========================================
  // TESTS: Validación de Eventos
  // ========================================

  describe('processEvents - Validation', () => {
    test('acepta eventos válidos', async () => {
      const rawEvents = [createRawEvent()];

      const result = await service.processEvents(rawEvents);

      expect(result.accepted).toBe(1);
      expect(result.rejected).toBe(0);
      expect(mockRepository.upsertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Metallica en Buenos Aires',
          }),
        ])
      );
    });

    test('rechaza eventos sin título', async () => {
      const rawEvents = [createRawEvent({ title: '' })];

      const result = await service.processEvents(rawEvents);

      expect(result.accepted).toBe(0);
      expect(result.rejected).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].reason).toContain('Campo requerido faltante: title');
      expect(mockRepository.upsertMany).not.toHaveBeenCalled();
    });

    test('rechaza eventos con título muy corto', async () => {
      const rawEvents = [createRawEvent({ title: 'AB' })];

      const result = await service.processEvents(rawEvents);

      expect(result.rejected).toBe(1);
      expect(result.errors[0].reason).toContain('Título muy corto');
    });

    test('rechaza eventos sin ciudad', async () => {
      const rawEvents = [createRawEvent({ city: '' })];

      const result = await service.processEvents(rawEvents);

      expect(result.rejected).toBe(1);
      expect(result.errors[0].reason).toContain('Ciudad es requerida');
    });

    test('rechaza eventos muy en el pasado', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);

      const rawEvents = [createRawEvent({ date: pastDate })];

      const result = await service.processEvents(rawEvents);

      expect(result.rejected).toBe(1);
      expect(result.errors[0].reason).toContain('muy en el pasado');
    });
  });

  // ========================================
  // TESTS: Normalización
  // ========================================

  describe('processEvents - Normalization', () => {
    test('normaliza ciudad a Title Case', async () => {
      const rawEvents = [createRawEvent({ city: 'buenos aires' })];

      await service.processEvents(rawEvents);

      expect(mockRepository.upsertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            city: 'Buenos Aires',
          }),
        ])
      );
    });

    test('normaliza país a código ISO', async () => {
      const rawEvents = [createRawEvent({ country: 'argentina' })];

      await service.processEvents(rawEvents);

      expect(mockRepository.upsertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            country: 'AR',
          }),
        ])
      );
    });

    test('normaliza categoría', async () => {
      const rawEvents = [createRawEvent({ category: 'concert' as any })];

      await service.processEvents(rawEvents);

      expect(mockRepository.upsertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            category: 'Concierto',
          }),
        ])
      );
    });

    test('hace trim de título con espacios', async () => {
      const rawEvents = [createRawEvent({ title: '  Metallica en Argentina  ' })];

      await service.processEvents(rawEvents);

      expect(mockRepository.upsertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Metallica en Argentina',
          }),
        ])
      );
    });
  });

  // ========================================
  // TESTS: Deduplicación
  // ========================================

  describe('processEvents - Deduplication', () => {
    test('detecta duplicados exactos', async () => {
      const existingEvent = createEvent();
      mockRepository.findByFilters = vi.fn().mockResolvedValue([existingEvent]);

      const rawEvents = [
        createRawEvent({
          title: 'Metallica en Buenos Aires',
          externalId: 'tm-002', // Diferente ID externo
        }),
      ];

      const result = await service.processEvents(rawEvents);

      expect(result.duplicates).toBe(1);
      expect(result.accepted).toBe(0);
      // No debería actualizar porque el evento es idéntico
      expect(mockRepository.upsertMany).not.toHaveBeenCalled();
    });

    test('detecta duplicados con títulos similares (fuzzy matching)', async () => {
      const existingEvent = createEvent({ title: 'Metallica - World Tour 2025' });
      mockRepository.findByFilters = vi.fn().mockResolvedValue([existingEvent]);

      const rawEvents = [
        createRawEvent({
          title: 'Metallica World Tour 2025', // Similar pero sin guión
        }),
      ];

      const result = await service.processEvents(rawEvents);

      expect(result.duplicates).toBe(1);
    });

    test('NO detecta duplicados si títulos muy diferentes', async () => {
      const existingEvent = createEvent({ title: 'Iron Maiden en Buenos Aires' });
      mockRepository.findByFilters = vi.fn().mockResolvedValue([existingEvent]);

      const rawEvents = [
        createRawEvent({
          title: 'Metallica en Buenos Aires',
        }),
      ];

      const result = await service.processEvents(rawEvents);

      expect(result.duplicates).toBe(0);
      expect(result.accepted).toBe(1);
    });

    test('actualiza duplicado si evento entrante tiene más información', async () => {
      const existingEvent = createEvent({
        description: 'Descripción corta',
        imageUrl: null,
      });
      mockRepository.findByFilters = vi.fn().mockResolvedValue([existingEvent]);

      const rawEvents = [
        createRawEvent({
          description: 'Descripción muy muy muy larga con muchos detalles del evento',
          imageUrl: 'https://example.com/new-image.jpg',
        }),
      ];

      const result = await service.processEvents(rawEvents);

      expect(result.duplicates).toBe(1);
      expect(result.updated).toBe(1);
      expect(mockRepository.upsertMany).toHaveBeenCalled();
    });

    test('NO actualiza duplicado si evento entrante proviene de fuente menos confiable', async () => {
      const existingEvent = createEvent({ source: 'ticketmaster' }); // Confiabilidad 10
      mockRepository.findByFilters = vi.fn().mockResolvedValue([existingEvent]);

      const rawEvents = [
        createRawEvent({
          source: 'scraper_local', // Confiabilidad 5
        }),
      ];

      const result = await service.processEvents(rawEvents);

      expect(result.duplicates).toBe(1);
      expect(result.updated).toBe(0);
      expect(mockRepository.upsertMany).not.toHaveBeenCalled();
    });
  });

  // ========================================
  // TESTS: Batch Processing
  // ========================================

  describe('processEvents - Batch Processing', () => {
    test('procesa múltiples eventos en un solo batch', async () => {
      const rawEvents = [
        createRawEvent({ externalId: 'tm-001', title: 'Evento 1' }),
        createRawEvent({ externalId: 'tm-002', title: 'Evento 2' }),
        createRawEvent({ externalId: 'tm-003', title: 'Evento 3' }),
      ];

      const result = await service.processEvents(rawEvents);

      expect(result.accepted).toBe(3);
      expect(mockRepository.upsertMany).toHaveBeenCalledTimes(1);
      expect(mockRepository.upsertMany).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ title: 'Evento 1' }),
        expect.objectContaining({ title: 'Evento 2' }),
        expect.objectContaining({ title: 'Evento 3' }),
      ]));
    });

    test('procesa mix de eventos válidos e inválidos', async () => {
      const rawEvents = [
        createRawEvent({ externalId: 'tm-001', title: 'Evento Válido 1' }),
        createRawEvent({ externalId: 'tm-002', title: '' }), // Inválido
        createRawEvent({ externalId: 'tm-003', title: 'Evento Válido 2' }),
        createRawEvent({ externalId: 'tm-004', city: '' }), // Inválido
      ];

      const result = await service.processEvents(rawEvents);

      expect(result.accepted).toBe(2);
      expect(result.rejected).toBe(2);
      expect(mockRepository.upsertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ title: 'Evento Válido 1' }),
          expect.objectContaining({ title: 'Evento Válido 2' }),
        ])
      );
    });

    test('continúa procesando aunque haya errores', async () => {
      const rawEvents = [
        createRawEvent({ externalId: 'tm-001', title: 'Evento Válido 1' }),
        createRawEvent({ externalId: 'tm-002', title: '' }), // Error
        createRawEvent({ externalId: 'tm-003', title: 'Evento Válido 2' }),
      ];

      const result = await service.processEvents(rawEvents);

      expect(result.accepted).toBe(2);
      expect(result.rejected).toBe(1);
      expect(result.errors).toHaveLength(1);
    });
  });

  // ========================================
  // TESTS: Escenarios Reales
  // ========================================

  describe('Real-World Scenarios', () => {
    test('Scenario: Scraping inicial de Ticketmaster (sin duplicados)', async () => {
      // Asegurar que no hay duplicados en BD
      mockRepository.findByFilters = vi.fn().mockResolvedValue([]);

      const futureDate1 = new Date();
      futureDate1.setDate(futureDate1.getDate() + 30);
      const futureDate2 = new Date();
      futureDate2.setDate(futureDate2.getDate() + 60);
      const futureDate3 = new Date();
      futureDate3.setDate(futureDate3.getDate() + 90);

      const rawEvents = [
        createRawEvent({ externalId: 'tm-001', title: 'Metallica en Buenos Aires', date: futureDate1 }),
        createRawEvent({ externalId: 'tm-002', title: 'Iron Maiden en Córdoba', date: futureDate2 }),
        createRawEvent({ externalId: 'tm-003', title: 'AC/DC en Rosario', date: futureDate3 }),
      ];

      const result = await service.processEvents(rawEvents);

      expect(result.accepted).toBe(3);
      expect(result.rejected).toBe(0);
      expect(result.duplicates).toBe(0);
    });

    test('Scenario: Segundo scraping detecta duplicados y actualiza', async () => {
      const existingEvent = createEvent({
        externalId: 'tm-001',
        description: 'Descripción vieja',
      });
      mockRepository.findByFilters = vi.fn().mockResolvedValue([existingEvent]);

      const rawEvents = [
        createRawEvent({
          externalId: 'tm-001',
          description: 'Descripción nueva mucho más larga con muchos detalles',
        }),
      ];

      const result = await service.processEvents(rawEvents);

      expect(result.duplicates).toBe(1);
      expect(result.updated).toBe(1);
    });

    test('Scenario: Datos mal formateados se normalizan automáticamente', async () => {
      const rawEvents = [
        createRawEvent({
          city: 'BUENOS AIRES  ', // Uppercase + espacios
          country: 'argentina', // Nombre completo
          category: 'concert', // Inglés
          title: '  Metallica  ', // Espacios
        }),
      ];

      await service.processEvents(rawEvents);

      expect(mockRepository.upsertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            city: 'Buenos Aires',
            country: 'AR',
            category: 'Concierto',
            title: 'Metallica',
          }),
        ])
      );
    });

    test('Scenario: Mismo evento en Ticketmaster y Eventbrite (cross-source deduplication)', async () => {
      const ticketmasterEvent = createEvent({
        source: 'ticketmaster',
        title: 'Metallica - World Tour 2025',
      });
      mockRepository.findByFilters = vi.fn().mockResolvedValue([ticketmasterEvent]);

      const eventbriteEvent = createRawEvent({
        source: 'eventbrite',
        title: 'Metallica World Tour 2025',
      });

      const result = await service.processEvents([eventbriteEvent]);

      expect(result.duplicates).toBe(1);
      // Ticketmaster es más confiable, no debería actualizar
      expect(result.updated).toBe(0);
    });
  });

  // ========================================
  // TESTS: Repository Delegation
  // ========================================

  describe('Repository Delegation', () => {
    test('findAll delega al repository', async () => {
      await service.findAll();
      expect(mockRepository.findAll).toHaveBeenCalled();
    });

    test('findById delega al repository', async () => {
      await service.findById('evt-001');
      expect(mockRepository.findById).toHaveBeenCalledWith('evt-001');
    });

    test('findByFilters delega al repository', async () => {
      const filters = { city: 'Buenos Aires' };
      await service.findByFilters(filters);
      expect(mockRepository.findByFilters).toHaveBeenCalledWith(filters);
    });
  });
});
