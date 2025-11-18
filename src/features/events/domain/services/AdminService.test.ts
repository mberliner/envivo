/**
 * AdminService Tests
 *
 * Tests para operaciones administrativas (delete + blacklist, reset database)
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { AdminService } from './AdminService';
import { IEventRepository } from '../interfaces/IEventRepository';
import { IBlacklistRepository } from '../interfaces/IBlacklistRepository';
import { Event } from '../entities/Event';

describe('AdminService', () => {
  let service: AdminService;
  let mockEventRepository: IEventRepository;
  let mockBlacklistRepository: IBlacklistRepository;

  const createMockEvent = (): Event => ({
    id: 'event-123',
    title: 'Metallica en Buenos Aires',
    date: new Date('2025-03-15'),
    venueName: 'Estadio River',
    city: 'Buenos Aires',
    country: 'AR',
    category: 'Concierto',
    source: 'allaccess',
    externalId: 'allaccess-metallica-123',
    currency: 'ARS',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(() => {
    mockEventRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      findByFilters: vi.fn(),
      upsertMany: vi.fn(),
      deleteById: vi.fn(),
      deleteAll: vi.fn(),
      count: vi.fn(),
    };

    mockBlacklistRepository = {
      isBlacklisted: vi.fn(),
      addToBlacklist: vi.fn(),
      clearAll: vi.fn(),
    };

    service = new AdminService(mockEventRepository, mockBlacklistRepository);
    vi.clearAllMocks();
  });

  describe('deleteEventAndBlacklist', () => {
    test('should delete event and add to blacklist when externalId exists', async () => {
      const mockEvent = createMockEvent();
      mockEventRepository.findById = vi.fn().mockResolvedValue(mockEvent);
      mockBlacklistRepository.addToBlacklist = vi.fn().mockResolvedValue(undefined);
      mockEventRepository.deleteById = vi.fn().mockResolvedValue(undefined);

      const result = await service.deleteEventAndBlacklist('event-123');

      expect(result).toEqual({
        success: true,
        event: {
          id: 'event-123',
          title: 'Metallica en Buenos Aires',
          source: 'allaccess',
          externalId: 'allaccess-metallica-123',
        },
        blacklisted: true,
      });

      expect(mockEventRepository.findById).toHaveBeenCalledWith('event-123');
      expect(mockBlacklistRepository.addToBlacklist).toHaveBeenCalledWith(
        'allaccess',
        'allaccess-metallica-123',
        'Usuario lo eliminó desde UI'
      );
      expect(mockEventRepository.deleteById).toHaveBeenCalledWith('event-123');
    });

    test('should delete event without blacklisting when externalId is missing', async () => {
      const mockEvent = { ...createMockEvent(), externalId: undefined };
      mockEventRepository.findById = vi.fn().mockResolvedValue(mockEvent);
      mockEventRepository.deleteById = vi.fn().mockResolvedValue(undefined);

      const result = await service.deleteEventAndBlacklist('event-123');

      expect(result.blacklisted).toBe(false);
      expect(mockBlacklistRepository.addToBlacklist).not.toHaveBeenCalled();
      expect(mockEventRepository.deleteById).toHaveBeenCalledWith('event-123');
    });

    test('should throw error when event not found', async () => {
      mockEventRepository.findById = vi.fn().mockResolvedValue(null);

      await expect(service.deleteEventAndBlacklist('non-existent')).rejects.toThrow(
        'Event not found'
      );

      expect(mockBlacklistRepository.addToBlacklist).not.toHaveBeenCalled();
      expect(mockEventRepository.deleteById).not.toHaveBeenCalled();
    });

    test('should delete event even if blacklist fails', async () => {
      const mockEvent = createMockEvent();
      mockEventRepository.findById = vi.fn().mockResolvedValue(mockEvent);
      mockBlacklistRepository.addToBlacklist = vi
        .fn()
        .mockRejectedValue(new Error('Blacklist failed'));
      mockEventRepository.deleteById = vi.fn().mockResolvedValue(undefined);

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await service.deleteEventAndBlacklist('event-123');

      expect(result.blacklisted).toBe(false);
      expect(mockEventRepository.deleteById).toHaveBeenCalledWith('event-123');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[AdminService] Failed to blacklist event:',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('resetDatabase', () => {
    test('should delete all events and blacklist entries', async () => {
      mockEventRepository.count = vi.fn().mockResolvedValue(150);
      mockEventRepository.deleteAll = vi.fn().mockResolvedValue(150);
      mockBlacklistRepository.clearAll = vi.fn().mockResolvedValue(25);

      const result = await service.resetDatabase();

      expect(result).toEqual({
        success: true,
        deletedCounts: {
          events: 150,
          blacklist: 25,
        },
      });

      expect(mockEventRepository.count).toHaveBeenCalled();
      expect(mockEventRepository.deleteAll).toHaveBeenCalled();
      expect(mockBlacklistRepository.clearAll).toHaveBeenCalled();
    });

    test('should handle empty database', async () => {
      mockEventRepository.count = vi.fn().mockResolvedValue(0);
      mockEventRepository.deleteAll = vi.fn().mockResolvedValue(0);
      mockBlacklistRepository.clearAll = vi.fn().mockResolvedValue(0);

      const result = await service.resetDatabase();

      expect(result.deletedCounts).toEqual({
        events: 0,
        blacklist: 0,
      });
    });
  });
});
