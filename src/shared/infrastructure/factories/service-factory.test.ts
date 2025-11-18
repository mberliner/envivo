/**
 * Service Factory Tests
 *
 * Tests para el factory centralizado de servicios
 */

import { describe, test, expect } from 'vitest';
import {
  createEventService,
  createSearchService,
  createAdminService,
  createEventRepository,
  createBlacklistRepository,
  createPreferencesRepository,
} from './service-factory';
import { EventService } from '@/features/events/domain/services/EventService';
import { SearchService } from '@/features/events/domain/services/SearchService';
import { AdminService } from '@/features/events/domain/services/AdminService';
import { PrismaEventRepository } from '@/features/events/data/repositories/PrismaEventRepository';
import { PrismaBlacklistRepository } from '@/features/events/data/repositories/PrismaBlacklistRepository';
import { PrismaPreferencesRepository } from '@/features/events/data/repositories/PrismaPreferencesRepository';

describe('Service Factory', () => {
  describe('createEventService', () => {
    test('should create EventService instance with all dependencies', () => {
      const service = createEventService();

      expect(service).toBeInstanceOf(EventService);
    });
  });

  describe('createSearchService', () => {
    test('should create SearchService instance with repository', () => {
      const service = createSearchService();

      expect(service).toBeInstanceOf(SearchService);
    });
  });

  describe('createAdminService', () => {
    test('should create AdminService instance with repositories', () => {
      const service = createAdminService();

      expect(service).toBeInstanceOf(AdminService);
    });
  });

  describe('createEventRepository', () => {
    test('should create PrismaEventRepository instance', () => {
      const repository = createEventRepository();

      expect(repository).toBeInstanceOf(PrismaEventRepository);
    });
  });

  describe('createBlacklistRepository', () => {
    test('should create PrismaBlacklistRepository instance', () => {
      const repository = createBlacklistRepository();

      expect(repository).toBeInstanceOf(PrismaBlacklistRepository);
    });
  });

  describe('createPreferencesRepository', () => {
    test('should create PrismaPreferencesRepository instance', () => {
      const repository = createPreferencesRepository();

      expect(repository).toBeInstanceOf(PrismaPreferencesRepository);
    });
  });
});
