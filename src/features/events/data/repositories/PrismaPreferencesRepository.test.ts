/**
 * PrismaPreferencesRepository Tests
 *
 * Tests unitarios para PrismaPreferencesRepository
 * Objetivo: Cobertura >80%
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  GlobalPreferences,
  DEFAULT_PREFERENCES,
} from '../../domain/entities/GlobalPreferences';

// Mock Prisma Client
vi.mock('@/shared/infrastructure/database/prisma', () => ({
  prisma: {
    globalPreferences: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    $queryRawUnsafe: vi.fn(),
  },
}));

import { PrismaPreferencesRepository } from './PrismaPreferencesRepository';
import { prisma } from '@/shared/infrastructure/database/prisma';

const mockPrismaPreferences = vi.mocked(prisma.globalPreferences);

describe('PrismaPreferencesRepository', () => {
  let repository: PrismaPreferencesRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaPreferencesRepository(prisma as never);
  });

  describe('get', () => {
    it('should return null if preferences do not exist', async () => {
      mockPrismaPreferences.findUnique.mockResolvedValueOnce(null);

      const result = await repository.get();

      expect(result).toBeNull();
      expect(mockPrismaPreferences.findUnique).toHaveBeenCalledWith({
        where: { id: 'singleton' },
      });
    });

    it('should return existing preferences', async () => {
      const mockDbPrefs = {
        id: 'singleton',
        allowedCountries: JSON.stringify(['AR', 'CL']),
        allowedCities: JSON.stringify(['Buenos Aires']),
        allowedGenres: JSON.stringify(['Rock']),
        blockedGenres: JSON.stringify([]),
        allowedCategories: JSON.stringify(['music']),
        allowedVenueSizes: JSON.stringify(['small', 'medium']),
        venueSizeThresholds: JSON.stringify({ small: 500, medium: 1500 }),
        needsRescraping: false,
        updatedAt: new Date(),
        updatedBy: null,
      };

      mockPrismaPreferences.findUnique.mockResolvedValueOnce(mockDbPrefs);

      const result = await repository.get();

      expect(result).not.toBeNull();
      expect(result?.allowedCountries).toEqual(['AR', 'CL']);
      expect(result?.allowedCities).toEqual(['Buenos Aires']);
      expect(result?.allowedGenres).toEqual(['Rock']);
      expect(result?.venueSizeThresholds).toEqual({ small: 500, medium: 1500 });
    });

    it('should handle malformed JSON gracefully', async () => {
      const mockDbPrefs = {
        id: 'singleton',
        allowedCountries: 'INVALID_JSON',
        allowedCities: '[]',
        allowedGenres: '[]',
        blockedGenres: '[]',
        allowedCategories: '[]',
        allowedVenueSizes: '[]',
        venueSizeThresholds: JSON.stringify(
          DEFAULT_PREFERENCES.venueSizeThresholds
        ),
        needsRescraping: false,
        updatedAt: new Date(),
        updatedBy: null,
      };

      mockPrismaPreferences.findUnique.mockResolvedValueOnce(mockDbPrefs);

      const result = await repository.get();

      // Debe devolver array vacío para JSON inválido
      expect(result?.allowedCountries).toEqual([]);
    });

    it('should handle malformed venueSizeThresholds JSON', async () => {
      const mockDbPrefs = {
        id: 'singleton',
        allowedCountries: '[]',
        allowedCities: '[]',
        allowedGenres: '[]',
        blockedGenres: '[]',
        allowedCategories: '[]',
        allowedVenueSizes: '[]',
        venueSizeThresholds: 'INVALID_JSON',
        needsRescraping: false,
        updatedAt: new Date(),
        updatedBy: null,
      };

      mockPrismaPreferences.findUnique.mockResolvedValueOnce(mockDbPrefs);

      const result = await repository.get();

      // Debe devolver DEFAULT_PREFERENCES.venueSizeThresholds para JSON inválido
      expect(result?.venueSizeThresholds).toEqual(
        DEFAULT_PREFERENCES.venueSizeThresholds
      );
    });
  });

  describe('update', () => {
    it('should create preferences if they do not exist', async () => {
      const updates: Partial<GlobalPreferences> = {
        allowedCountries: ['AR', 'CL'],
        allowedCities: ['Buenos Aires'],
      };

      const mockResult = {
        id: 'singleton',
        allowedCountries: JSON.stringify(['AR', 'CL']),
        allowedCities: JSON.stringify(['Buenos Aires']),
        allowedGenres: JSON.stringify([]),
        blockedGenres: JSON.stringify([]),
        allowedCategories: JSON.stringify([]),
        allowedVenueSizes: JSON.stringify([]),
        venueSizeThresholds: JSON.stringify(
          DEFAULT_PREFERENCES.venueSizeThresholds
        ),
        needsRescraping: false,
        updatedAt: new Date(),
        updatedBy: null,
      };

      mockPrismaPreferences.upsert.mockResolvedValueOnce(mockResult);

      const result = await repository.update(updates);

      expect(result.allowedCountries).toEqual(['AR', 'CL']);
      expect(result.allowedCities).toEqual(['Buenos Aires']);
    });

    it('should update existing preferences', async () => {
      const updates: Partial<GlobalPreferences> = {
        allowedCountries: ['AR', 'CL', 'UY'],
      };

      const mockResult = {
        id: 'singleton',
        allowedCountries: JSON.stringify(['AR', 'CL', 'UY']),
        allowedCities: JSON.stringify([]),
        allowedGenres: JSON.stringify([]),
        blockedGenres: JSON.stringify([]),
        allowedCategories: JSON.stringify([]),
        allowedVenueSizes: JSON.stringify([]),
        venueSizeThresholds: JSON.stringify(
          DEFAULT_PREFERENCES.venueSizeThresholds
        ),
        needsRescraping: false,
        updatedAt: new Date(),
        updatedBy: null,
      };

      mockPrismaPreferences.upsert.mockResolvedValueOnce(mockResult);

      const result = await repository.update(updates);

      expect(result.allowedCountries).toEqual(['AR', 'CL', 'UY']);
    });

    it('should update multiple fields at once', async () => {
      const updates: Partial<GlobalPreferences> = {
        allowedCountries: ['AR'],
        allowedCities: ['Buenos Aires', 'Córdoba'],
        allowedGenres: ['Rock', 'Metal'],
        needsRescraping: true,
      };

      const mockResult = {
        id: 'singleton',
        allowedCountries: JSON.stringify(['AR']),
        allowedCities: JSON.stringify(['Buenos Aires', 'Córdoba']),
        allowedGenres: JSON.stringify(['Rock', 'Metal']),
        blockedGenres: JSON.stringify([]),
        allowedCategories: JSON.stringify([]),
        allowedVenueSizes: JSON.stringify([]),
        venueSizeThresholds: JSON.stringify(
          DEFAULT_PREFERENCES.venueSizeThresholds
        ),
        needsRescraping: true,
        updatedAt: new Date(),
        updatedBy: null,
      };

      mockPrismaPreferences.upsert.mockResolvedValueOnce(mockResult);

      const result = await repository.update(updates);

      expect(result.allowedCountries).toEqual(['AR']);
      expect(result.allowedCities).toEqual(['Buenos Aires', 'Córdoba']);
      expect(result.allowedGenres).toEqual(['Rock', 'Metal']);
      expect(result.needsRescraping).toBe(true);
    });
  });

  describe('needsRescraping', () => {
    it('should return false if preferences do not exist', async () => {
      mockPrismaPreferences.findUnique.mockResolvedValueOnce(null);

      const result = await repository.needsRescraping();

      expect(result).toBe(false);
    });

    it('should return true if needsRescraping flag is set', async () => {
      mockPrismaPreferences.findUnique.mockResolvedValueOnce({
        needsRescraping: true,
      } as never);

      const result = await repository.needsRescraping();

      expect(result).toBe(true);
    });

    it('should return false if needsRescraping flag is not set', async () => {
      mockPrismaPreferences.findUnique.mockResolvedValueOnce({
        needsRescraping: false,
      } as never);

      const result = await repository.needsRescraping();

      expect(result).toBe(false);
    });
  });

  describe('markRescrapingDone', () => {
    it('should set needsRescraping to false', async () => {
      mockPrismaPreferences.update.mockResolvedValueOnce({} as never);

      await repository.markRescrapingDone();

      expect(mockPrismaPreferences.update).toHaveBeenCalledWith({
        where: { id: 'singleton' },
        data: { needsRescraping: false },
      });
    });
  });

  describe('initialize', () => {
    it('should create preferences with default values', async () => {
      const mockResult = {
        id: 'singleton',
        allowedCountries: JSON.stringify(DEFAULT_PREFERENCES.allowedCountries),
        allowedCities: JSON.stringify(DEFAULT_PREFERENCES.allowedCities),
        allowedGenres: JSON.stringify(DEFAULT_PREFERENCES.allowedGenres),
        blockedGenres: JSON.stringify(DEFAULT_PREFERENCES.blockedGenres),
        allowedCategories: JSON.stringify(DEFAULT_PREFERENCES.allowedCategories),
        allowedVenueSizes: JSON.stringify(DEFAULT_PREFERENCES.allowedVenueSizes),
        venueSizeThresholds: JSON.stringify(
          DEFAULT_PREFERENCES.venueSizeThresholds
        ),
        needsRescraping: DEFAULT_PREFERENCES.needsRescraping,
        updatedAt: new Date(),
        updatedBy: null,
      };

      mockPrismaPreferences.create.mockResolvedValueOnce(mockResult);

      const result = await repository.initialize();

      expect(result.allowedCountries).toEqual(
        DEFAULT_PREFERENCES.allowedCountries
      );
      expect(result.allowedCities).toEqual(DEFAULT_PREFERENCES.allowedCities);
      expect(result.allowedGenres).toEqual(DEFAULT_PREFERENCES.allowedGenres);
      expect(result.blockedGenres).toEqual(DEFAULT_PREFERENCES.blockedGenres);
      expect(result.allowedCategories).toEqual(
        DEFAULT_PREFERENCES.allowedCategories
      );
      expect(result.allowedVenueSizes).toEqual(
        DEFAULT_PREFERENCES.allowedVenueSizes
      );
      expect(result.venueSizeThresholds).toEqual(
        DEFAULT_PREFERENCES.venueSizeThresholds
      );
      expect(result.needsRescraping).toBe(DEFAULT_PREFERENCES.needsRescraping);
    });
  });
});
