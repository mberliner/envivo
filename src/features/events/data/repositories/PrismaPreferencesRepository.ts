/**
 * PrismaPreferencesRepository
 *
 * Implementación de IPreferencesRepository usando Prisma ORM
 *
 * @module Data/Repositories
 */

import { PrismaClient, Prisma } from '@prisma/client';
import {
  GlobalPreferences,
  DEFAULT_PREFERENCES,
  VenueSizeThresholds,
} from '../../domain/entities/GlobalPreferences';
import { IPreferencesRepository } from '../../domain/interfaces/IPreferencesRepository';

export class PrismaPreferencesRepository implements IPreferencesRepository {
  private readonly SINGLETON_ID = 'singleton';

  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Obtiene las preferencias globales actuales
   */
  async get(): Promise<GlobalPreferences | null> {
    const prefs = await this.prisma.globalPreferences.findUnique({
      where: { id: this.SINGLETON_ID },
    });

    if (!prefs) {
      return null;
    }

    return this.toDomain(prefs);
  }

  /**
   * Actualiza las preferencias globales
   * Si no existen, las crea
   */
  async update(
    preferences: Partial<GlobalPreferences>
  ): Promise<GlobalPreferences> {
    const data = this.toPrisma(preferences);

    const updated = await this.prisma.globalPreferences.upsert({
      where: { id: this.SINGLETON_ID },
      update: data,
      create: {
        id: this.SINGLETON_ID,
        ...data,
      },
    });

    return this.toDomain(updated);
  }

  /**
   * Verifica si se necesita re-scraping
   */
  async needsRescraping(): Promise<boolean> {
    const prefs = await this.prisma.globalPreferences.findUnique({
      where: { id: this.SINGLETON_ID },
      select: { needsRescraping: true },
    });

    return prefs?.needsRescraping || false;
  }

  /**
   * Marca que el re-scraping fue completado
   */
  async markRescrapingDone(): Promise<void> {
    await this.prisma.globalPreferences.update({
      where: { id: this.SINGLETON_ID },
      data: { needsRescraping: false },
    });
  }

  /**
   * Inicializa las preferencias con valores por defecto
   */
  async initialize(): Promise<GlobalPreferences> {
    const created = await this.prisma.globalPreferences.create({
      data: {
        id: this.SINGLETON_ID,
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
      },
    });

    return this.toDomain(created);
  }

  /**
   * Convierte de modelo Prisma a entidad de dominio
   */
  private toDomain(prismaPrefs: Prisma.GlobalPreferencesGetPayload<Record<string, never>>): GlobalPreferences {
    // Helper para parsear JSON arrays con fallback
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parseArray = (value: string | any[], fallback: any[] = []): any[] => {
      try {
        return typeof value === 'string' ? JSON.parse(value) : value;
      } catch {
        return fallback;
      }
    };

    // Parse venueSizeThresholds de JSON string a objeto
    let thresholds: VenueSizeThresholds;
    try {
      thresholds =
        typeof prismaPrefs.venueSizeThresholds === 'string'
          ? JSON.parse(prismaPrefs.venueSizeThresholds)
          : prismaPrefs.venueSizeThresholds;
    } catch {
      // Fallback a valores por defecto si falla el parsing
      thresholds = DEFAULT_PREFERENCES.venueSizeThresholds;
    }

    return {
      id: prismaPrefs.id,
      allowedCountries: parseArray(prismaPrefs.allowedCountries, []),
      allowedCities: parseArray(prismaPrefs.allowedCities, []),
      allowedGenres: parseArray(prismaPrefs.allowedGenres, []),
      blockedGenres: parseArray(prismaPrefs.blockedGenres, []),
      allowedCategories: parseArray(prismaPrefs.allowedCategories, []),
      allowedVenueSizes: parseArray(prismaPrefs.allowedVenueSizes, []),
      venueSizeThresholds: thresholds,
      needsRescraping: prismaPrefs.needsRescraping || false,
      updatedAt: prismaPrefs.updatedAt,
      updatedBy: prismaPrefs.updatedBy || undefined,
    };
  }

  /**
   * Convierte de entidad de dominio a modelo Prisma
   */
  private toPrisma(preferences: Partial<GlobalPreferences>): Partial<Prisma.GlobalPreferencesCreateInput> {
    const data: Partial<Prisma.GlobalPreferencesCreateInput> = {};

    if (preferences.allowedCountries !== undefined) {
      data.allowedCountries = JSON.stringify(preferences.allowedCountries);
    }
    if (preferences.allowedCities !== undefined) {
      data.allowedCities = JSON.stringify(preferences.allowedCities);
    }
    if (preferences.allowedGenres !== undefined) {
      data.allowedGenres = JSON.stringify(preferences.allowedGenres);
    }
    if (preferences.blockedGenres !== undefined) {
      data.blockedGenres = JSON.stringify(preferences.blockedGenres);
    }
    if (preferences.allowedCategories !== undefined) {
      data.allowedCategories = JSON.stringify(preferences.allowedCategories);
    }
    if (preferences.allowedVenueSizes !== undefined) {
      data.allowedVenueSizes = JSON.stringify(preferences.allowedVenueSizes);
    }
    if (preferences.venueSizeThresholds !== undefined) {
      data.venueSizeThresholds = JSON.stringify(
        preferences.venueSizeThresholds
      );
    }
    if (preferences.needsRescraping !== undefined) {
      data.needsRescraping = preferences.needsRescraping;
    }
    if (preferences.updatedBy !== undefined) {
      data.updatedBy = preferences.updatedBy;
    }

    return data;
  }
}
