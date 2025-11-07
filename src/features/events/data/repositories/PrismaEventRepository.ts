import {
  IEventRepository,
  EventFilters,
} from '@/features/events/domain/interfaces/IEventRepository';
import { Event } from '@/features/events/domain/entities/Event';
import { RawEvent } from '@/features/events/domain/entities/Event';
import { prisma } from '@/shared/infrastructure/database/prisma';

/**
 * Implementación de IEventRepository usando Prisma ORM
 */
export class PrismaEventRepository implements IEventRepository {
  /**
   * Retorna todos los eventos ordenados por fecha
   */
  async findAll(): Promise<Event[]> {
    const events = await prisma.event.findMany({
      orderBy: {
        date: 'asc',
      },
    });

    return events.map(this.toDomainEvent);
  }

  /**
   * Busca un evento por ID
   */
  async findById(id: string): Promise<Event | null> {
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return null;
    }

    return this.toDomainEvent(event);
  }

  /**
   * Busca eventos aplicando filtros
   */
  async findByFilters(filters: EventFilters): Promise<Event[]> {
    const where: any = {};

    if (filters.city) {
      where.city = {
        contains: filters.city,
        mode: 'insensitive',
      };
    }

    if (filters.country) {
      where.country = filters.country;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.date = {};
      if (filters.dateFrom) {
        where.date.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.date.lte = filters.dateTo;
      }
    }

    // Búsqueda simple en título (FTS5 será en fase posterior)
    if (filters.search) {
      where.title = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: {
        date: 'asc',
      },
    });

    return events.map(this.toDomainEvent);
  }

  /**
   * Inserta o actualiza múltiples eventos
   * Usa externalId + source como clave única para detectar duplicados
   */
  async upsertMany(rawEvents: RawEvent[]): Promise<number> {
    let upsertedCount = 0;

    for (const rawEvent of rawEvents) {
      try {
        // Buscar evento existente por externalId + source
        const existingEvent = rawEvent.externalId
          ? await prisma.event.findFirst({
              where: {
                externalId: rawEvent.externalId,
                // TODO: agregar source cuando tengamos múltiples fuentes
              },
            })
          : null;

        const eventData = {
          title: rawEvent.title,
          description: rawEvent.description || null,
          date: typeof rawEvent.date === 'string' ? new Date(rawEvent.date) : rawEvent.date,
          endDate:
            typeof rawEvent.endDate === 'string'
              ? new Date(rawEvent.endDate)
              : rawEvent.endDate || null,
          city: rawEvent.city || 'Unknown',
          country: rawEvent.country || 'Unknown',
          category: rawEvent.category || 'Otro',
          genre: rawEvent.genre || null,
          imageUrl: rawEvent.imageUrl || null,
          ticketUrl: rawEvent.ticketUrl || null,
          price: rawEvent.price ?? null,
          priceMax: rawEvent.priceMax ?? null,
          currency: rawEvent.currency || 'USD',
          source: (rawEvent as any)._source || 'unknown', // Por ahora hardcodeado
          externalId: rawEvent.externalId || null,
        };

        if (existingEvent) {
          // Actualizar evento existente
          await prisma.event.update({
            where: { id: existingEvent.id },
            data: {
              ...eventData,
              updatedAt: new Date(),
            },
          });
        } else {
          // Crear nuevo evento
          await prisma.event.create({
            data: eventData,
          });
        }

        upsertedCount++;
      } catch (error) {
        console.error(`Failed to upsert event: ${rawEvent.title}`, error);
        // Continuar con otros eventos
      }
    }

    return upsertedCount;
  }

  /**
   * Elimina un evento por ID
   */
  async deleteById(id: string): Promise<void> {
    await prisma.event.delete({
      where: { id },
    });
  }

  /**
   * Convierte modelo de Prisma a entidad de dominio
   */
  private toDomainEvent(prismaEvent: any): Event {
    return {
      id: prismaEvent.id,
      title: prismaEvent.title,
      description: prismaEvent.description,
      date: prismaEvent.date,
      endDate: prismaEvent.endDate,
      venueId: prismaEvent.venueId,
      venueName: null, // TODO: cargar venue en fase posterior
      city: prismaEvent.city,
      country: prismaEvent.country,
      category: prismaEvent.category,
      genre: prismaEvent.genre,
      artists: undefined, // TODO: cargar artists en fase posterior
      imageUrl: prismaEvent.imageUrl,
      ticketUrl: prismaEvent.ticketUrl,
      price: prismaEvent.price,
      priceMax: prismaEvent.priceMax,
      currency: prismaEvent.currency,
      venueCapacity: undefined,
      source: prismaEvent.source,
      externalId: prismaEvent.externalId,
      createdAt: prismaEvent.createdAt,
      updatedAt: prismaEvent.updatedAt,
    };
  }
}
