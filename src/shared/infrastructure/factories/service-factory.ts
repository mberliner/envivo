/**
 * Service Factory
 *
 * Factory centralizado para crear instancias de servicios con sus dependencias.
 * Este es el ÚNICO lugar que conoce las implementaciones concretas (Prisma).
 *
 * Clean Architecture:
 * - Domain define interfaces (IEventRepository, IBlacklistRepository)
 * - Data implementa esas interfaces (PrismaEventRepository, PrismaBlacklistRepository)
 * - App Layer usa este factory para obtener servicios ya configurados
 *
 * Beneficios:
 * - DRY: Evita duplicación de código de instanciación
 * - Testabilidad: Fácil reemplazar por mocks
 * - Flexibilidad: Un solo lugar para cambiar implementaciones
 *
 * @module Infrastructure/Factories
 */

import { EventService } from '@/features/events/domain/services/EventService';
import { SearchService } from '@/features/events/domain/services/SearchService';
import { AdminService } from '@/features/events/domain/services/AdminService';
import {
  EventBusinessRules,
  DEFAULT_BUSINESS_RULES,
} from '@/features/events/domain/services/EventBusinessRules';
import { PreferencesService } from '@/features/events/domain/services/PreferencesService';
import { PrismaEventRepository } from '@/features/events/data/repositories/PrismaEventRepository';
import { PrismaBlacklistRepository } from '@/features/events/data/repositories/PrismaBlacklistRepository';
import { PrismaPreferencesRepository } from '@/features/events/data/repositories/PrismaPreferencesRepository';
import { IEventRepository } from '@/features/events/domain/interfaces/IEventRepository';
import { IBlacklistRepository } from '@/features/events/domain/interfaces/IBlacklistRepository';
import { IPreferencesRepository } from '@/features/events/domain/interfaces/IPreferencesRepository';
import { prisma } from '@/shared/infrastructure/database/prisma';

/**
 * Crea una instancia de EventService con todas sus dependencias
 */
export function createEventService(): EventService {
  const repository = createEventRepository();
  const blacklistRepository = createBlacklistRepository();
  const preferencesRepository = createPreferencesRepository();
  const preferencesService = new PreferencesService(preferencesRepository);
  const businessRules = new EventBusinessRules(DEFAULT_BUSINESS_RULES, preferencesService);

  return new EventService(repository, blacklistRepository, businessRules);
}

/**
 * Crea una instancia de SearchService con todas sus dependencias
 */
export function createSearchService(): SearchService {
  const repository = createEventRepository();

  return new SearchService(repository);
}

/**
 * Crea una instancia de IEventRepository (Prisma implementation)
 */
export function createEventRepository(): IEventRepository {
  return new PrismaEventRepository();
}

/**
 * Crea una instancia de IBlacklistRepository (Prisma implementation)
 */
export function createBlacklistRepository(): IBlacklistRepository {
  return new PrismaBlacklistRepository();
}

/**
 * Crea una instancia de IPreferencesRepository (Prisma implementation)
 */
export function createPreferencesRepository(): IPreferencesRepository {
  return new PrismaPreferencesRepository(prisma);
}

/**
 * Crea una instancia de AdminService con todas sus dependencias
 */
export function createAdminService(): AdminService {
  const eventRepository = createEventRepository();
  const blacklistRepository = createBlacklistRepository();

  return new AdminService(eventRepository, blacklistRepository);
}
