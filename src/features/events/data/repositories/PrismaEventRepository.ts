import {
  IEventRepository,
  EventFilters,
} from '@/features/events/domain/interfaces/IEventRepository';
import { Event, EventCategory } from '@/features/events/domain/entities/Event';
import { RawEvent } from '@/features/events/domain/entities/Event';
import { prisma } from '@/shared/infrastructure/database/prisma';
import { Prisma } from '@prisma/client';

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
    const where: Prisma.EventWhereInput = {};

    // Filtro por ciudad (exact match - viene de dropdown)
    if (filters.city) {
      where.city = filters.city;
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

    // Búsqueda simple en título (case-sensitive en SQLite)
    // TODO: Implementar FTS5 para búsqueda case-insensitive en Fase posterior
    if (filters.search) {
      where.title = {
        contains: filters.search,
        // mode: 'insensitive' no soportado en SQLite
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

        const venueName = rawEvent.venue || null;
        console.log(`[PrismaEventRepository] 💾 Saving event: "${rawEvent.title.substring(0, 40)}" | rawEvent.venue="${rawEvent.venue}" | venueName="${venueName}"`);

        const eventData = {
          title: rawEvent.title,
          description: rawEvent.description || null,
          date: typeof rawEvent.date === 'string' ? new Date(rawEvent.date) : rawEvent.date,
          endDate:
            typeof rawEvent.endDate === 'string'
              ? new Date(rawEvent.endDate)
              : rawEvent.endDate || null,
          venueName: venueName,
          city: rawEvent.city || 'Unknown',
          country: rawEvent.country || 'Unknown',
          category: rawEvent.category || 'Otro',
          genre: rawEvent.genre || null,
          imageUrl: rawEvent.imageUrl || null,
          ticketUrl: rawEvent.ticketUrl || null,
          price: rawEvent.price ?? null,
          priceMax: rawEvent.priceMax ?? null,
          currency: rawEvent.currency || 'USD',
          source: rawEvent.source || 'unknown', // Fix: usar source (Events ya tienen source, no _source)
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
  private toDomainEvent(prismaEvent: Prisma.EventGetPayload<Record<string, never>>): Event {
    return {
      id: prismaEvent.id,
      title: prismaEvent.title,
      description: prismaEvent.description || undefined,
      date: prismaEvent.date,
      endDate: prismaEvent.endDate || undefined,
      venueId: prismaEvent.venueId || undefined,
      venueName: prismaEvent.venueName || undefined,
      city: prismaEvent.city,
      country: prismaEvent.country,
      category: prismaEvent.category as EventCategory,
      genre: prismaEvent.genre || undefined,
      artists: undefined, // TODO: cargar artists en fase posterior
      imageUrl: prismaEvent.imageUrl || undefined,
      ticketUrl: prismaEvent.ticketUrl || undefined,
      price: prismaEvent.price ?? undefined,
      priceMax: prismaEvent.priceMax ?? undefined,
      currency: prismaEvent.currency,
      venueCapacity: undefined,
      source: prismaEvent.source,
      externalId: prismaEvent.externalId || undefined,
      createdAt: prismaEvent.createdAt,
      updatedAt: prismaEvent.updatedAt,
    };
  }
}
