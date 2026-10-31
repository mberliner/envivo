import {
  IEventRepository,
  EventFilters,
} from '@/features/events/domain/interfaces/IEventRepository';
import { Event, EventCategory } from '@/features/events/domain/entities/Event';
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

    const events = await prisma.event.findMany({
      where,
      orderBy: {
        date: 'asc',
      },
    });

    const domainEvents = events.map(this.toDomainEvent);

    // Búsqueda en título y nombre del venue (case-insensitive y sin acentos en memoria,
    // ya que SQLite LIKE no soporta normalización de acentos ni case-insensitivity Unicode)
    if (filters.search) {
      const normalizedSearch = this.normalizeForSearch(filters.search);
      return domainEvents.filter((event) => {
        const titleMatch = this.normalizeForSearch(event.title).includes(normalizedSearch);
        const venueMatch = event.venueName
          ? this.normalizeForSearch(event.venueName).includes(normalizedSearch)
          : false;
        return titleMatch || venueMatch;
      });
    }

    return domainEvents;
  }

  /**
   * Normaliza un texto para búsqueda (minúsculas y sin acentos/diacríticos)
   */
  private normalizeForSearch(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Inserta o actualiza múltiples eventos
   * Usa externalId + source como clave única para detectar duplicados
   */
  async upsertMany(events: Event[]): Promise<number> {
    let upsertedCount = 0;

    for (const event of events) {
      try {
        // 1. Si el evento ya tiene un ID real (no temp-...), usarlo directamenente (viene de fuzzy dedup)
        let existingEvent = null;
        if (event.id && !event.id.startsWith('temp-')) {
          existingEvent = await prisma.event.findUnique({
            where: { id: event.id },
          });
        }

        // 2. Si no se encontró por ID, buscar por externalId + source
        if (!existingEvent && event.externalId) {
          existingEvent = await prisma.event.findFirst({
            where: {
              externalId: event.externalId,
              // TODO: agregar source cuando tengamos múltiples fuentes
            },
          });
        }

        const venueName = event.venueName || null;
        console.log(
          `[PrismaEventRepository] 💾 Saving event: "${event.title.substring(0, 40)}" | event.venueName="${event.venueName}" | venueName="${venueName}"`
        );

        const eventData = {
          title: event.title,
          description: event.description || null,
          date: typeof event.date === 'string' ? new Date(event.date) : event.date,
          endDate:
            typeof event.endDate === 'string' ? new Date(event.endDate) : event.endDate || null,
          venueName: venueName,
          city: event.city || 'Unknown',
          country: event.country || 'Unknown',
          category: event.category || 'Otro',
          genre: event.genre || null,
          imageUrl: event.imageUrl || null,
          ticketUrl: event.ticketUrl || null,
          price: event.price ?? null,
          priceMax: event.priceMax ?? null,
          currency: event.currency || 'ARS',
          source: event.source || 'unknown',
          externalId: event.externalId || null,
        };

        if (existingEvent) {
          // Actualizar evento existente
          // Preservar precio existente si el nuevo es null (evita perder datos por fallas de scraping)
          if (eventData.price === null && existingEvent.price !== null) {
            eventData.price = existingEvent.price;
            console.log(
              `[PrismaEventRepository] ⚠️  Preserving existing price: ${existingEvent.price}`
            );
          }
          if (eventData.priceMax === null && existingEvent.priceMax !== null) {
            eventData.priceMax = existingEvent.priceMax;
          }

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
        console.error(`Failed to upsert event: ${event.title}`, error);
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
   * Elimina todos los eventos cuya fecha de fin (o inicio si no tiene fin)
   * sea anterior a la fecha dada.
   * @param date Fecha límite (exclusiva)
   * @returns Número de eventos eliminados
   */
  async deleteBeforeDate(date: Date): Promise<number> {
    const result = await prisma.event.deleteMany({
      where: {
        OR: [
          // Caso 1: Tiene fecha de fin, usar esa
          { endDate: { lt: date } },
          // Caso 2: No tiene fecha de fin, usar fecha de inicio
          { endDate: null, date: { lt: date } },
        ],
      },
    });
    return result.count;
  }

  /**
   * Elimina todos los eventos
   * @returns Número de eventos eliminados
   */
  async deleteAll(): Promise<number> {
    const result = await prisma.event.deleteMany({});
    return result.count;
  }

  /**
   * Cuenta el total de eventos
   * @returns Número total de eventos
   */
  async count(): Promise<number> {
    return await prisma.event.count();
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
