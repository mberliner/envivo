import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RawEvent } from '@/features/events/domain/entities/Event';

// Mock Prisma Client - usar factory function
vi.mock('@/shared/infrastructure/database/prisma', () => ({
  prisma: {
    event: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { PrismaEventRepository } from './PrismaEventRepository';
import { prisma } from '@/shared/infrastructure/database/prisma';

// Obtener referencia a los mocks después del import
const mockPrismaEvent = vi.mocked(prisma.event);

describe('PrismaEventRepository', () => {
  let repository: PrismaEventRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PrismaEventRepository();
  });

  describe('findAll', () => {
    it('should return all events ordered by date', async () => {
      const mockEvents = [
        {
          id: 'event1',
          title: 'Event 1',
          date: new Date('2025-12-01'),
          city: 'Buenos Aires',
          country: 'AR',
          category: 'Concierto',
          currency: 'ARS',
          source: 'ticketmaster',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'event2',
          title: 'Event 2',
          date: new Date('2025-12-02'),
          city: 'Cordoba',
          country: 'AR',
          category: 'Festival',
          currency: 'ARS',
          source: 'ticketmaster',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockPrismaEvent.findMany.mockResolvedValueOnce(mockEvents as any[]);

      const events = await repository.findAll();

      expect(mockPrismaEvent.findMany).toHaveBeenCalledWith({
        orderBy: {
          date: 'asc',
        },
      });
      expect(events).toHaveLength(2);
      expect(events[0].title).toBe('Event 1');
      expect(events[1].title).toBe('Event 2');
    });
  });

  describe('findById', () => {
    it('should return event if found', async () => {
      const mockEvent = {
        id: 'event1',
        title: 'Metallica Live',
        date: new Date('2025-12-01'),
        city: 'Buenos Aires',
        country: 'AR',
        category: 'Concierto',
        currency: 'ARS',
        source: 'ticketmaster',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockPrismaEvent.findUnique.mockResolvedValueOnce(mockEvent as any);

      const event = await repository.findById('event1');

      expect(mockPrismaEvent.findUnique).toHaveBeenCalledWith({
        where: { id: 'event1' },
      });
      expect(event).not.toBeNull();
      expect(event?.title).toBe('Metallica Live');
    });

    it('should return null if event not found', async () => {
      mockPrismaEvent.findUnique.mockResolvedValueOnce(null);

      const event = await repository.findById('nonexistent');

      expect(event).toBeNull();
    });
  });

  describe('findByFilters', () => {
    it('should filter events by city', async () => {
      mockPrismaEvent.findMany.mockResolvedValueOnce([
        {
          id: 'event1',
          title: 'Event in BA',
          date: new Date(),
          city: 'Buenos Aires',
          country: 'AR',
          category: 'Concierto',
          currency: 'ARS',
          source: 'ticketmaster',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any[]);

      const events = await repository.findByFilters({ city: 'Buenos Aires' });

      expect(mockPrismaEvent.findMany).toHaveBeenCalledWith({
        where: {
          city: 'Buenos Aires',
        },
        orderBy: {
          date: 'asc',
        },
      });
      expect(events).toHaveLength(1);
    });

    it('should filter events by date range', async () => {
      mockPrismaEvent.findMany.mockResolvedValueOnce([]);

      const dateFrom = new Date('2025-12-01');
      const dateTo = new Date('2025-12-31');

      await repository.findByFilters({ dateFrom, dateTo });

      expect(mockPrismaEvent.findMany).toHaveBeenCalledWith({
        where: {
          date: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
        orderBy: {
          date: 'asc',
        },
      });
    });

    it('should filter events by search term', async () => {
      mockPrismaEvent.findMany.mockResolvedValueOnce([]);

      await repository.findByFilters({ search: 'Metallica' });

      expect(mockPrismaEvent.findMany).toHaveBeenCalledWith({
        where: {
          title: {
            contains: 'Metallica',
          },
        },
        orderBy: {
          date: 'asc',
        },
      });
    });
  });

  describe('upsertMany', () => {
    it('should create new events if they do not exist', async () => {
      const rawEvents: RawEvent[] = [
        {
          title: 'New Event',
          date: new Date('2025-12-01'),
          city: 'Buenos Aires',
          country: 'AR',
          externalId: 'tm-123',
          _source: 'ticketmaster',
        },
      ];

      mockPrismaEvent.findFirst.mockResolvedValueOnce(null); // No existe
      mockPrismaEvent.create.mockResolvedValueOnce({
        id: 'new-id',
        ...rawEvents[0],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const count = await repository.upsertMany(rawEvents);

      expect(mockPrismaEvent.findFirst).toHaveBeenCalledWith({
        where: {
          externalId: 'tm-123',
        },
      });
      expect(mockPrismaEvent.create).toHaveBeenCalled();
      expect(count).toBe(1);
    });

    it('should update existing events if they exist', async () => {
      const rawEvents: RawEvent[] = [
        {
          title: 'Updated Event',
          date: new Date('2025-12-01'),
          city: 'Buenos Aires',
          country: 'AR',
          externalId: 'tm-123',
          _source: 'ticketmaster',
        },
      ];

      const existingEvent = {
        id: 'existing-id',
        externalId: 'tm-123',
        title: 'Old Title',
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockPrismaEvent.findFirst.mockResolvedValueOnce(existingEvent as any);
      mockPrismaEvent.update.mockResolvedValueOnce({
        ...existingEvent,
        title: 'Updated Event',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const count = await repository.upsertMany(rawEvents);

      expect(mockPrismaEvent.update).toHaveBeenCalledWith({
        where: { id: 'existing-id' },
        data: expect.objectContaining({
          title: 'Updated Event',
        }),
      });
      expect(count).toBe(1);
    });

    it('should continue with other events if one fails', async () => {
      const rawEvents: RawEvent[] = [
        {
          title: 'Event 1',
          date: new Date('2025-12-01'),
          externalId: 'tm-1',
          _source: 'ticketmaster',
        },
        {
          title: 'Event 2',
          date: new Date('2025-12-02'),
          externalId: 'tm-2',
          _source: 'ticketmaster',
        },
      ];

      mockPrismaEvent.findFirst.mockResolvedValueOnce(null);
      mockPrismaEvent.create.mockRejectedValueOnce(new Error('DB error')); // Falla el primero
      mockPrismaEvent.findFirst.mockResolvedValueOnce(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockPrismaEvent.create.mockResolvedValueOnce({ id: 'event2-id' } as any); // Éxito el segundo

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const count = await repository.upsertMany(rawEvents);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to upsert event'),
        expect.any(Error)
      );
      expect(count).toBe(1); // Solo 1 insertado exitosamente

      consoleSpy.mockRestore();
    });
  });

  describe('deleteById', () => {
    it('should delete event by id', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockPrismaEvent.delete.mockResolvedValueOnce({ id: 'event1' } as any);

      await repository.deleteById('event1');

      expect(mockPrismaEvent.delete).toHaveBeenCalledWith({
        where: { id: 'event1' },
      });
    });
  });
});
