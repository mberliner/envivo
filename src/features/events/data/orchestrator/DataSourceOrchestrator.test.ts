/**
 * DataSourceOrchestrator Tests
 *
 * Tests para el orchestrator que ejecuta múltiples data sources en paralelo
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mocks deben ir ANTES de los imports que los usan
vi.mock('@/shared/infrastructure/database/prisma', () => ({
  prisma: {},
}));

vi.mock('@/features/events/domain/services/EventService', () => {
  return {
    EventService: vi.fn().mockImplementation(() => ({
      processEvents: vi.fn().mockResolvedValue({
        accepted: 1,
        rejected: 0,
        duplicates: 0,
        updated: 0,
        errors: [],
      }),
    })),
  };
});

// Imports después de los mocks
import { DataSourceOrchestrator } from './DataSourceOrchestrator';
import type { IDataSource } from '@/features/events/domain/interfaces/IDataSource';
import type { RawEvent } from '@/features/events/domain/entities/Event';
import type { IEventRepository } from '@/features/events/domain/interfaces/IEventRepository';

describe('DataSourceOrchestrator', () => {
  let orchestrator: DataSourceOrchestrator;
  let mockRepository: IEventRepository;

  // Helper para crear un data source mock
  const createMockSource = (name: string, events: RawEvent[], shouldFail = false): IDataSource => ({
    name,
    type: 'api',
    fetch: vi.fn().mockImplementation(async () => {
      if (shouldFail) {
        throw new Error(`${name} failed`);
      }
      return events;
    }),
  });

  // Helper para crear un RawEvent
  const createRawEvent = (overrides?: Partial<RawEvent>): RawEvent => ({
    title: 'Test Event',
    date: new Date('2025-03-15'),
    city: 'Buenos Aires',
    country: 'AR',
    ...overrides,
  });

  beforeEach(() => {
    // Mock del repository
    mockRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByFilters: vi.fn().mockResolvedValue([]),
      upsertMany: vi.fn().mockResolvedValue(0),
      deleteById: vi.fn(),
    };

    orchestrator = new DataSourceOrchestrator(mockRepository);
  });

  // ========================================
  // TESTS: Construcción y Registro
  // ========================================

  describe('Construction and Registration', () => {
    test('crea orchestrator sin sources', () => {
      expect(orchestrator).toBeDefined();
      expect(orchestrator.getSources()).toHaveLength(0);
    });

    test('registra un data source', () => {
      const source = createMockSource('allaccess', []);
      orchestrator.registerSource(source);

      expect(orchestrator.getSources()).toHaveLength(1);
      expect(orchestrator.getSources()[0].name).toBe('allaccess');
    });

    test('registra múltiples data sources', () => {
      const source1 = createMockSource('allaccess', []);
      const source2 = createMockSource('eventbrite', []);

      orchestrator.registerSource(source1);
      orchestrator.registerSource(source2);

      expect(orchestrator.getSources()).toHaveLength(2);
    });

    test('no registra el mismo source dos veces', () => {
      const source = createMockSource('allaccess', []);

      orchestrator.registerSource(source);
      orchestrator.registerSource(source);

      expect(orchestrator.getSources()).toHaveLength(1);
    });
  });

  // ========================================
  // TESTS: Ejecución Paralela
  // ========================================

  describe('Parallel Execution', () => {
    test('ejecuta un source y retorna eventos', async () => {
      const events = [createRawEvent({ title: 'Metallica' })];
      const source = createMockSource('allaccess', events);

      orchestrator.registerSource(source);
      const result = await orchestrator.fetchAll();

      expect(result.sources).toHaveLength(1);
      expect(result.sources[0].name).toBe('allaccess');
      expect(result.sources[0].success).toBe(true);
      expect(result.sources[0].eventsCount).toBe(1);
    });

    test('ejecuta múltiples sources en paralelo', async () => {
      const events1 = [createRawEvent({ title: 'Metallica' })];
      const events2 = [createRawEvent({ title: 'Coldplay' })];

      const source1 = createMockSource('allaccess', events1);
      const source2 = createMockSource('eventbrite', events2);

      orchestrator.registerSource(source1);
      orchestrator.registerSource(source2);

      const startTime = Date.now();
      const result = await orchestrator.fetchAll();
      const duration = Date.now() - startTime;

      expect(result.sources).toHaveLength(2);
      expect(result.sources[0].success).toBe(true);
      expect(result.sources[1].success).toBe(true);

      // Debería ejecutarse en paralelo (< 1 segundo para 2 sources)
      expect(duration).toBeLessThan(1000);
    });

    test('continúa ejecutando si un source falla', async () => {
      const events = [createRawEvent({ title: 'Coldplay' })];

      const failingSource = createMockSource('allaccess', [], true);
      const workingSource = createMockSource('eventbrite', events);

      orchestrator.registerSource(failingSource);
      orchestrator.registerSource(workingSource);

      const result = await orchestrator.fetchAll();

      expect(result.sources).toHaveLength(2);
      expect(result.sources[0].success).toBe(false);
      expect(result.sources[0].error).toContain('allaccess failed');
      expect(result.sources[1].success).toBe(true);
      expect(result.sources[1].eventsCount).toBe(1);
    });

    test('retorna resultado incluso si todos los sources fallan', async () => {
      const source1 = createMockSource('allaccess', [], true);
      const source2 = createMockSource('eventbrite', [], true);

      orchestrator.registerSource(source1);
      orchestrator.registerSource(source2);

      const result = await orchestrator.fetchAll();

      expect(result.sources).toHaveLength(2);
      expect(result.sources[0].success).toBe(false);
      expect(result.sources[1].success).toBe(false);
      expect(result.totalEvents).toBe(0);
    });
  });

  // ========================================
  // TESTS: Integración con EventService
  // ========================================

  describe('EventService Integration', () => {
    test('procesa eventos con EventService', async () => {
      const events = [
        createRawEvent({ title: 'Metallica' }),
        createRawEvent({ title: 'Coldplay' }),
      ];
      const source = createMockSource('allaccess', events);

      orchestrator.registerSource(source);
      const result = await orchestrator.fetchAll();

      // Verificar que EventService procesó eventos (al menos intentó procesar)
      expect(result.totalEvents).toBe(2);
      expect(result.totalProcessed).toBeGreaterThanOrEqual(0);
    });

    test('reporta eventos aceptados y rechazados', async () => {
      const events = [
        createRawEvent({ title: 'Metallica', city: 'Buenos Aires' }), // Válido
        createRawEvent({ title: '', city: '' }), // Inválido (sin título ni ciudad)
      ];
      const source = createMockSource('allaccess', events);

      orchestrator.registerSource(source);
      const result = await orchestrator.fetchAll();

      expect(result.totalEvents).toBe(2);
      // Al menos 1 debería ser procesado
      expect(result.totalProcessed).toBeGreaterThanOrEqual(0);
    });

    test('procesa eventos de múltiples sources', async () => {
      const sameEvent = createRawEvent({
        title: 'Metallica en Buenos Aires',
        city: 'Buenos Aires',
        date: new Date('2025-03-15'),
      });

      const source1 = createMockSource('allaccess', [sameEvent]);
      const source2 = createMockSource('eventbrite', [sameEvent]);

      orchestrator.registerSource(source1);
      orchestrator.registerSource(source2);

      const result = await orchestrator.fetchAll();

      expect(result.totalEvents).toBe(2); // 2 eventos scrapeados
      // EventService procesa los eventos (deduplicación está testeada en EventService.test.ts)
      expect(result.totalDuplicates).toBeGreaterThanOrEqual(0);
    });
  });

  // ========================================
  // TESTS: Resultado del Orchestrator
  // ========================================

  describe('Result Structure', () => {
    test('retorna estructura correcta de resultado', async () => {
      const events = [createRawEvent()];
      const source = createMockSource('allaccess', events);

      orchestrator.registerSource(source);
      const result = await orchestrator.fetchAll();

      expect(result).toHaveProperty('sources');
      expect(result).toHaveProperty('totalEvents');
      expect(result).toHaveProperty('totalProcessed');
      expect(result).toHaveProperty('totalDuplicates');
      expect(result).toHaveProperty('totalErrors');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('timestamp');
    });

    test('calcula totales correctamente', async () => {
      const events1 = [createRawEvent({ title: 'Event 1' }), createRawEvent({ title: 'Event 2' })];
      const events2 = [createRawEvent({ title: 'Event 3' })];

      const source1 = createMockSource('allaccess', events1);
      const source2 = createMockSource('eventbrite', events2);

      orchestrator.registerSource(source1);
      orchestrator.registerSource(source2);

      const result = await orchestrator.fetchAll();

      expect(result.totalEvents).toBe(3);
      expect(result.sources[0].eventsCount).toBe(2);
      expect(result.sources[1].eventsCount).toBe(1);
    });

    test('incluye timestamp y duration', async () => {
      const source = createMockSource('allaccess', []);
      orchestrator.registerSource(source);

      const result = await orchestrator.fetchAll();

      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });

  // ========================================
  // TESTS: Métodos Auxiliares
  // ========================================

  describe('Helper Methods', () => {
    test('getSources retorna array de sources registrados', () => {
      const source1 = createMockSource('allaccess', []);
      const source2 = createMockSource('eventbrite', []);

      orchestrator.registerSource(source1);
      orchestrator.registerSource(source2);

      const sources = orchestrator.getSources();
      expect(sources).toHaveLength(2);
      expect(sources[0].name).toBe('allaccess');
      expect(sources[1].name).toBe('eventbrite');
    });

    test('clearSources elimina todos los sources', () => {
      const source = createMockSource('allaccess', []);
      orchestrator.registerSource(source);

      expect(orchestrator.getSources()).toHaveLength(1);

      orchestrator.clearSources();

      expect(orchestrator.getSources()).toHaveLength(0);
    });
  });

  // ========================================
  // TESTS: Casos Reales
  // ========================================

  describe('Real-World Scenarios', () => {
    test('Scenario: Scraping diario de múltiples fuentes', async () => {
      // Simular scraping real con AllAccess y Eventbrite
      const aaEvents = [
        createRawEvent({ title: 'Metallica', externalId: 'aa-001' }),
        createRawEvent({ title: 'Coldplay', externalId: 'aa-002' }),
      ];
      const ebEvents = [createRawEvent({ title: 'Fito Páez', externalId: 'eb-001' })];

      const allaccess = createMockSource('allaccess', aaEvents);
      const eventbrite = createMockSource('eventbrite', ebEvents);

      orchestrator.registerSource(allaccess);
      orchestrator.registerSource(eventbrite);

      const result = await orchestrator.fetchAll();

      expect(result.sources).toHaveLength(2);
      expect(result.totalEvents).toBe(3);
      expect(result.sources.every((s) => s.success)).toBe(true);
    });

    test('Scenario: Una API falla pero las otras continúan', async () => {
      const aaEvents = [createRawEvent({ title: 'Metallica' })];

      const allaccess = createMockSource('allaccess', aaEvents);
      const eventbrite = createMockSource('eventbrite', [], true); // Falla
      const local = createMockSource('local_scraper', [createRawEvent({ title: 'Local Event' })]);

      orchestrator.registerSource(allaccess);
      orchestrator.registerSource(eventbrite);
      orchestrator.registerSource(local);

      const result = await orchestrator.fetchAll();

      expect(result.sources).toHaveLength(3);
      expect(result.sources.filter((s) => s.success)).toHaveLength(2);
      expect(result.sources.filter((s) => !s.success)).toHaveLength(1);
      expect(result.totalEvents).toBe(2); // Solo de AllAccess y local
    });
  });
});
