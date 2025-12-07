/**
 * SearchService Tests
 *
 * Tests completos de búsqueda y filtrado usando fixtures realistas
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { SearchService } from './SearchService';
import { IEventRepository } from '../interfaces/IEventRepository';
import { mockEvents } from '@/test/fixtures/events.fixtures';

// Mock repository
const mockRepository: IEventRepository = {
  findAll: vi.fn().mockResolvedValue(mockEvents),
  findById: vi.fn(),
  findByFilters: vi.fn(),
  upsertMany: vi.fn(),
  deleteById: vi.fn(),
  deleteBeforeDate: vi.fn(),
  deleteAll: vi.fn().mockResolvedValue(0),
  count: vi.fn().mockResolvedValue(0),
};

describe('SearchService', () => {
  let service: SearchService;

  beforeEach(() => {
    service = new SearchService(mockRepository);
    vi.clearAllMocks();
  });

  // ========================================
  // TESTS: Búsqueda por Texto
  // ========================================

  describe('search - Text Query', () => {
    test('busca eventos por título (case-insensitive)', async () => {
      mockRepository.findByFilters = vi.fn().mockImplementation(({ search }) => {
        if (!search) return mockEvents;
        return mockEvents.filter((e) => e.title.toLowerCase().includes(search.toLowerCase()));
      });

      const result = await service.search({ q: 'metallica' });

      expect(result.events.length).toBeGreaterThan(0);
      expect(result.events[0].title).toContain('Metallica');
    });

    test('busca eventos por descripción', async () => {
      mockRepository.findByFilters = vi.fn().mockImplementation(({ search }) => {
        if (!search) return mockEvents;
        return mockEvents.filter((e) =>
          e.description?.toLowerCase().includes(search.toLowerCase())
        );
      });

      const result = await service.search({ q: 'heavy metal' });

      expect(result.events.length).toBeGreaterThan(0);
    });

    test('normaliza query sin acentos', async () => {
      mockRepository.findByFilters = vi.fn().mockImplementation(({ search }) => {
        if (!search) return mockEvents;
        // Normalizar tanto search como contenido
        const normalizedSearch = search.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return mockEvents.filter((e) => {
          const normalized = e.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          return normalized.toLowerCase().includes(normalizedSearch.toLowerCase());
        });
      });

      const result1 = await service.search({ q: 'Paez' });
      const result2 = await service.search({ q: 'Páez' });

      // Ambas búsquedas deben dar el mismo resultado (normalizadas)
      expect(result1.events.length).toBe(result2.events.length);
    });

    test('ignora queries muy cortas (<2 caracteres)', async () => {
      mockRepository.findByFilters = vi.fn().mockResolvedValue(mockEvents);

      await service.search({ q: 'M' });

      // No debe filtrar por búsqueda si es muy corta
      expect(mockRepository.findByFilters).toHaveBeenCalledWith({});
    });

    test('hace trim de espacios en query', async () => {
      mockRepository.findByFilters = vi.fn().mockResolvedValue([mockEvents[0]]);

      await service.search({ q: '  Metallica  ' });

      expect(mockRepository.findByFilters).toHaveBeenCalledWith(
        expect.objectContaining({ search: expect.any(String) })
      );
    });
  });

  // ========================================
  // TESTS: Filtros Individuales
  // ========================================

  describe('search - Individual Filters', () => {
    test('filtra por ciudad', async () => {
      mockRepository.findByFilters = vi.fn().mockImplementation(({ city }) => {
        if (!city) return mockEvents;
        return mockEvents.filter((e) => e.city === city);
      });

      const result = await service.search({ city: 'Buenos Aires' });

      expect(result.events.length).toBeGreaterThan(0);
      expect(result.events.every((e) => e.city === 'Buenos Aires')).toBe(true);
    });

    test('filtra por categoría', async () => {
      mockRepository.findByFilters = vi.fn().mockImplementation(({ category }) => {
        if (!category) return mockEvents;
        return mockEvents.filter((e) => e.category === category);
      });

      const result = await service.search({ category: 'Concierto' });

      expect(result.events.length).toBeGreaterThan(0);
      expect(result.events.every((e) => e.category === 'Concierto')).toBe(true);
    });

    test('filtra por fecha desde', async () => {
      const dateFrom = new Date('2025-03-01');
      mockRepository.findByFilters = vi.fn().mockImplementation(({ dateFrom: df }) => {
        if (!df) return mockEvents;
        return mockEvents.filter((e) => e.date >= df);
      });

      const result = await service.search({ dateFrom });

      expect(result.events.length).toBeGreaterThan(0);
      expect(result.events.every((e) => e.date >= dateFrom)).toBe(true);
    });

    test('filtra por fecha hasta', async () => {
      const dateTo = new Date('2025-04-01');
      mockRepository.findByFilters = vi.fn().mockImplementation(({ dateTo: dt }) => {
        if (!dt) return mockEvents;
        return mockEvents.filter((e) => e.date <= dt);
      });

      const result = await service.search({ dateTo });

      expect(result.events.length).toBeGreaterThan(0);
      expect(result.events.every((e) => e.date <= dateTo)).toBe(true);
    });

    test('filtra por rango de fechas', async () => {
      const dateFrom = new Date('2025-02-01');
      const dateTo = new Date('2025-03-31');

      mockRepository.findByFilters = vi.fn().mockImplementation(({ dateFrom: df, dateTo: dt }) => {
        return mockEvents.filter((e) => {
          if (df && e.date < df) return false;
          if (dt && e.date > dt) return false;
          return true;
        });
      });

      const result = await service.search({ dateFrom, dateTo });

      expect(result.events.length).toBeGreaterThan(0);
      expect(result.events.every((e) => e.date >= dateFrom && e.date <= dateTo)).toBe(true);
    });
  });

  // ========================================
  // TESTS: Combinación de Filtros
  // ========================================

  describe('search - Combined Filters', () => {
    test('combina texto + ciudad', async () => {
      mockRepository.findByFilters = vi.fn().mockImplementation(({ search, city }) => {
        return mockEvents.filter((e) => {
          if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
          if (city && e.city !== city) return false;
          return true;
        });
      });

      const result = await service.search({
        q: 'tour',
        city: 'Buenos Aires',
      });

      expect(result.events.length).toBeGreaterThan(0);
      expect(result.events.every((e) => e.city === 'Buenos Aires')).toBe(true);
    });

    test('combina texto + categoría + ciudad', async () => {
      mockRepository.findByFilters = vi.fn().mockImplementation(({ search, category, city }) => {
        return mockEvents.filter((e) => {
          if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
          if (category && e.category !== category) return false;
          if (city && e.city !== city) return false;
          return true;
        });
      });

      const result = await service.search({
        q: 'metallica',
        category: 'Concierto',
        city: 'Buenos Aires',
      });

      expect(result.events.length).toBeGreaterThan(0);
      expect(result.events[0].title).toContain('Metallica');
      expect(result.events[0].category).toBe('Concierto');
      expect(result.events[0].city).toBe('Buenos Aires');
    });

    test('combina todos los filtros posibles', async () => {
      const dateFrom = new Date('2025-03-01');
      const dateTo = new Date('2025-03-31');

      mockRepository.findByFilters = vi
        .fn()
        .mockImplementation(({ search, category, city, dateFrom: df, dateTo: dt }) => {
          return mockEvents.filter((e) => {
            if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
            if (category && e.category !== category) return false;
            if (city && e.city !== city) return false;
            if (df && e.date < df) return false;
            if (dt && e.date > dt) return false;
            return true;
          });
        });

      const result = await service.search({
        q: 'rock',
        category: 'Concierto',
        city: 'Buenos Aires',
        dateFrom,
        dateTo,
      });

      // Debe retornar solo eventos que cumplan TODOS los filtros
      expect(
        result.events.every(
          (e) =>
            e.category === 'Concierto' &&
            e.city === 'Buenos Aires' &&
            e.date >= dateFrom &&
            e.date <= dateTo
        )
      ).toBe(true);
    });
  });

  // ========================================
  // TESTS: Paginación
  // ========================================

  describe('search - Pagination', () => {
    test('retorna máximo 50 eventos por defecto', async () => {
      // Crear más de 50 eventos mockeados
      const manyEvents = Array.from({ length: 100 }, (_, i) => ({
        ...mockEvents[0],
        id: `evt-${i}`,
      }));

      mockRepository.findByFilters = vi.fn().mockResolvedValue(manyEvents);

      const result = await service.search({});

      expect(result.events.length).toBe(50); // Default limit
      expect(result.total).toBe(100);
      expect(result.hasMore).toBe(true);
    });

    test('respeta limit personalizado', async () => {
      mockRepository.findByFilters = vi.fn().mockResolvedValue(mockEvents);

      const result = await service.search({ limit: 5 });

      expect(result.events.length).toBeLessThanOrEqual(5);
    });

    test('respeta offset para paginación', async () => {
      mockRepository.findByFilters = vi.fn().mockResolvedValue(mockEvents);

      const page1 = await service.search({ limit: 5, offset: 0 });
      const page2 = await service.search({ limit: 5, offset: 5 });

      // IDs diferentes entre páginas
      expect(page1.events[0].id).not.toBe(page2.events[0].id);
    });

    test('indica hasMore correctamente', async () => {
      mockRepository.findByFilters = vi.fn().mockResolvedValue(mockEvents);

      const result1 = await service.search({ limit: 5, offset: 0 });
      const result2 = await service.search({ limit: 100, offset: 0 });

      expect(result1.hasMore).toBe(true); // Hay más de 5
      expect(result2.hasMore).toBe(false); // No hay más de 100
    });
  });

  // ========================================
  // TESTS: Autocomplete/Sugerencias
  // ========================================

  describe('suggest', () => {
    test('retorna sugerencias basadas en títulos', async () => {
      const suggestions = await service.suggest('Metal');

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some((s) => s.toLowerCase().includes('metal'))).toBe(true);
    });

    test('limita sugerencias a 5 por defecto', async () => {
      const suggestions = await service.suggest('a');

      expect(suggestions.length).toBeLessThanOrEqual(5);
    });

    test('respeta limit personalizado', async () => {
      const suggestions = await service.suggest('a', 3);

      expect(suggestions.length).toBeLessThanOrEqual(3);
    });

    test('retorna array vacío si query muy corta', async () => {
      const suggestions = await service.suggest('M');

      expect(suggestions).toEqual([]);
    });

    test('normaliza query para sugerencias', async () => {
      const suggestions1 = await service.suggest('Paez');
      const suggestions2 = await service.suggest('Páez');

      // Deben dar resultados similares (normalización)
      expect(suggestions1.length).toBe(suggestions2.length);
    });
  });

  // ========================================
  // TESTS: Obtener Opciones de Filtros
  // ========================================

  describe('getAvailableCities', () => {
    test('retorna lista de ciudades únicas', async () => {
      const cities = await service.getAvailableCities();

      expect(cities.length).toBeGreaterThan(0);
      expect(Array.from(new Set(cities)).length).toBe(cities.length); // Sin duplicados
    });

    test('retorna ciudades ordenadas alfabéticamente', async () => {
      const cities = await service.getAvailableCities();

      const sorted = [...cities].sort();
      expect(cities).toEqual(sorted);
    });
  });

  describe('getAvailableCategories', () => {
    test('retorna lista de categorías únicas', async () => {
      const categories = await service.getAvailableCategories();

      expect(categories.length).toBeGreaterThan(0);
      expect(Array.from(new Set(categories)).length).toBe(categories.length); // Sin duplicados
    });

    test('retorna categorías ordenadas alfabéticamente', async () => {
      const categories = await service.getAvailableCategories();

      const sorted = [...categories].sort();
      expect(categories).toEqual(sorted);
    });
  });

  // ========================================
  // TESTS: Casos Edge
  // ========================================

  describe('Edge Cases', () => {
    test('maneja búsqueda sin resultados', async () => {
      mockRepository.findByFilters = vi.fn().mockResolvedValue([]);

      const result = await service.search({ q: 'evento inexistente xyz123' });

      expect(result.events).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    test('maneja query vacía', async () => {
      mockRepository.findByFilters = vi.fn().mockResolvedValue(mockEvents);

      await service.search({ q: '' });

      // No debe aplicar filtro de búsqueda
      expect(mockRepository.findByFilters).toHaveBeenCalledWith({});
    });

    test('maneja query con espacios', async () => {
      mockRepository.findByFilters = vi.fn().mockResolvedValue(mockEvents);

      await service.search({ q: '   ' });

      // No debe aplicar filtro (después de trim es vacío)
      expect(mockRepository.findByFilters).toHaveBeenCalledWith({});
    });

    test('maneja repository error gracefully', async () => {
      mockRepository.findByFilters = vi.fn().mockRejectedValue(new Error('DB Error'));

      await expect(service.search({ q: 'test' })).rejects.toThrow('DB Error');
    });
  });

  // ========================================
  // TESTS: Escenarios Reales
  // ========================================

  describe('Real-World Scenarios', () => {
    test('Scenario: Usuario busca "metallica buenos aires"', async () => {
      mockRepository.findByFilters = vi.fn().mockImplementation(({ search, city }) => {
        return mockEvents.filter((e) => {
          if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
          if (city && e.city !== city) return false;
          return true;
        });
      });

      const result = await service.search({
        q: 'metallica',
        city: 'Buenos Aires',
      });

      expect(result.events.length).toBeGreaterThan(0);
      expect(result.events[0].title).toContain('Metallica');
      expect(result.events[0].city).toBe('Buenos Aires');
    });

    test('Scenario: Usuario filtra solo festivales', async () => {
      mockRepository.findByFilters = vi.fn().mockImplementation(({ category }) => {
        if (!category) return mockEvents;
        return mockEvents.filter((e) => e.category === category);
      });

      const result = await service.search({ category: 'Festival' });

      expect(result.events.length).toBeGreaterThan(0);
      expect(result.events.every((e) => e.category === 'Festival')).toBe(true);
    });

    test('Scenario: Usuario busca eventos del próximo mes', async () => {
      const now = new Date();
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      mockRepository.findByFilters = vi.fn().mockImplementation(({ dateFrom, dateTo }) => {
        return mockEvents.filter((e) => {
          if (dateFrom && e.date < dateFrom) return false;
          if (dateTo && e.date > dateTo) return false;
          return true;
        });
      });

      const result = await service.search({
        dateFrom: now,
        dateTo: nextMonth,
      });

      expect(result.events.every((e) => e.date >= now && e.date <= nextMonth)).toBe(true);
    });
  });
});
