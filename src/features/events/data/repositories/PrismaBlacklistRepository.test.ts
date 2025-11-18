/**
 * PrismaBlacklistRepository Tests
 *
 * Tests para el repositorio de blacklist usando Prisma (con mocks)
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { PrismaBlacklistRepository } from './PrismaBlacklistRepository';

// Mock Prisma
vi.mock('@/shared/infrastructure/database/prisma', () => ({
  prisma: {
    $queryRawUnsafe: vi.fn(),
    $executeRawUnsafe: vi.fn(),
  },
}));

// Mock nanoid
vi.mock('nanoid', () => ({
  nanoid: () => 'test-id-123',
}));

// Import mocked prisma
import { prisma } from '@/shared/infrastructure/database/prisma';

describe('PrismaBlacklistRepository', () => {
  let repository: PrismaBlacklistRepository;

  beforeEach(() => {
    repository = new PrismaBlacklistRepository();
    vi.clearAllMocks();
  });

  describe('isBlacklisted', () => {
    test('should return true when event is blacklisted', async () => {
      // Mock query to return 1 row (blacklisted)
      vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([{ id: 'test-id-1' }]);

      const result = await repository.isBlacklisted('test-source', 'test-event-123');

      expect(result).toBe(true);
      expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
        'SELECT id FROM event_blacklist WHERE source = ? AND externalId = ? LIMIT 1',
        'test-source',
        'test-event-123'
      );
    });

    test('should return false when event is not blacklisted', async () => {
      // Mock query to return empty array
      vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([]);

      const result = await repository.isBlacklisted('test-source', 'non-existent-event');

      expect(result).toBe(false);
    });

    test('should return false on database error (fail-safe)', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Mock prisma to throw error
      vi.mocked(prisma.$queryRawUnsafe).mockRejectedValue(new Error('DB error'));

      const result = await repository.isBlacklisted('test-source', 'test-event-123');

      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[PrismaBlacklistRepository] Error checking blacklist:',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('addToBlacklist', () => {
    test('should add event to blacklist', async () => {
      vi.mocked(prisma.$executeRawUnsafe).mockResolvedValue(1);

      await repository.addToBlacklist('test-source', 'test-event-456', 'Test reason');

      expect(prisma.$executeRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO event_blacklist'),
        'test-id-123',
        'test-source',
        'test-event-456',
        'Test reason',
        expect.any(String)
      );
    });

    test('should handle duplicate entries gracefully (ON CONFLICT DO NOTHING)', async () => {
      vi.mocked(prisma.$executeRawUnsafe).mockResolvedValue(0); // 0 rows inserted (conflict)

      await expect(
        repository.addToBlacklist('test-source', 'test-event-789', 'Second reason')
      ).resolves.not.toThrow();

      expect(prisma.$executeRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('ON CONFLICT'),
        expect.any(String),
        'test-source',
        'test-event-789',
        'Second reason',
        expect.any(String)
      );
    });

    test('should throw error on database failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock prisma to throw error
      vi.mocked(prisma.$executeRawUnsafe).mockRejectedValue(new Error('DB error'));

      await expect(
        repository.addToBlacklist('test-source', 'test-event-error', 'Test reason')
      ).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[PrismaBlacklistRepository] Error adding to blacklist:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('clearAll', () => {
    test('should delete all blacklist entries and return count', async () => {
      // Mock COUNT query to return 3
      vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([{ count: 3 }]);
      // Mock DELETE to succeed
      vi.mocked(prisma.$executeRawUnsafe).mockResolvedValue(3);

      const deletedCount = await repository.clearAll();

      expect(deletedCount).toBe(3);
      expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
        'SELECT COUNT(*) as count FROM event_blacklist'
      );
      expect(prisma.$executeRawUnsafe).toHaveBeenCalledWith('DELETE FROM event_blacklist');
    });

    test('should handle BigInt count correctly', async () => {
      // Mock COUNT query to return BigInt
      vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([{ count: BigInt(100) }]);
      vi.mocked(prisma.$executeRawUnsafe).mockResolvedValue(100);

      const deletedCount = await repository.clearAll();

      expect(deletedCount).toBe(100);
    });

    test('should return 0 when blacklist is empty', async () => {
      vi.mocked(prisma.$queryRawUnsafe).mockResolvedValue([{ count: 0 }]);
      vi.mocked(prisma.$executeRawUnsafe).mockResolvedValue(0);

      const deletedCount = await repository.clearAll();

      expect(deletedCount).toBe(0);
    });

    test('should throw error on database failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock prisma to throw error
      vi.mocked(prisma.$queryRawUnsafe).mockRejectedValue(new Error('DB error'));

      await expect(repository.clearAll()).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[PrismaBlacklistRepository] Error clearing blacklist:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
