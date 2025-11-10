import { describe, it, expect } from 'vitest';
import type { GlobalPreferences } from './GlobalPreferences';

describe('GlobalPreferences Entity', () => {
  it('should create valid global preferences with default values', () => {
    const mockPreferences: GlobalPreferences = {
      id: 'singleton',
      allowedCountries: ['AR', 'UY', 'CL'],
      allowedCities: ['Buenos Aires', 'Montevideo', 'Santiago'],
      allowedGenres: ['Rock', 'Pop', 'Jazz'],
      blockedGenres: [],
      allowedCategories: ['Concierto', 'Festival'],
      allowedVenueSizes: ['small', 'medium', 'large'],
      venueSizeThresholds: {
        small: 500,
        medium: 2000,
        large: 5000,
      },
      needsRescraping: false,
      updatedAt: new Date(),
    };

    expect(mockPreferences.id).toBe('singleton');
    expect(mockPreferences.allowedCountries).toHaveLength(3);
    expect(mockPreferences.allowedCountries).toContain('AR');
    expect(mockPreferences.needsRescraping).toBe(false);
    expect(mockPreferences.venueSizeThresholds.small).toBe(500);
  });

  it('should support blocking genres while allowing others', () => {
    const preferences: GlobalPreferences = {
      id: 'singleton',
      allowedCountries: ['AR'],
      allowedCities: [],
      allowedGenres: ['Rock', 'Metal', 'Punk'],
      blockedGenres: ['Reggaeton', 'Trap'],
      allowedCategories: ['Concierto'],
      allowedVenueSizes: ['medium', 'large'],
      venueSizeThresholds: {
        small: 500,
        medium: 2000,
        large: 5000,
      },
      needsRescraping: true,
      updatedAt: new Date(),
    };

    expect(preferences.allowedGenres).toContain('Rock');
    expect(preferences.blockedGenres).toContain('Reggaeton');
    expect(preferences.needsRescraping).toBe(true);
  });

  it('should allow custom venue size thresholds', () => {
    const customThresholds = {
      small: 300,
      medium: 1500,
      large: 10000,
    };

    const preferences: GlobalPreferences = {
      id: 'singleton',
      allowedCountries: ['AR'],
      allowedCities: [],
      allowedGenres: [],
      blockedGenres: [],
      allowedCategories: ['Concierto'],
      allowedVenueSizes: ['small', 'large'],
      venueSizeThresholds: customThresholds,
      needsRescraping: false,
      updatedAt: new Date(),
    };

    expect(preferences.venueSizeThresholds.small).toBe(300);
    expect(preferences.venueSizeThresholds.medium).toBe(1500);
    expect(preferences.venueSizeThresholds.large).toBe(10000);
  });

  it('should allow empty arrays for optional list fields', () => {
    const minimalPreferences: GlobalPreferences = {
      id: 'singleton',
      allowedCountries: ['AR'],
      allowedCities: [],
      allowedGenres: [],
      blockedGenres: [],
      allowedCategories: ['Concierto'],
      allowedVenueSizes: ['small', 'medium', 'large'],
      venueSizeThresholds: {
        small: 500,
        medium: 2000,
        large: 5000,
      },
      needsRescraping: false,
      updatedAt: new Date(),
    };

    expect(minimalPreferences.allowedCities).toEqual([]);
    expect(minimalPreferences.allowedGenres).toEqual([]);
    expect(minimalPreferences.blockedGenres).toEqual([]);
  });
});
