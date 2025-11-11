/**
 * EventService
 *
 * Servicio de dominio que orquesta la lógica de negocio para eventos:
 * - Validación de eventos entrantes
 * - Normalización de datos
 * - Deduplicación con fuzzy matching
 * - Decisión de insertar vs actualizar
 *
 * @module Domain/Services
 */

import { Event, RawEvent } from '../entities/Event';
import { IEventRepository, EventFilters } from '../interfaces/IEventRepository';
import { EventBusinessRules } from './EventBusinessRules';
import { prisma } from '@/shared/infrastructure/database/prisma';

export interface ProcessEventsResult {
  accepted: number;
  rejected: number;
  duplicates: number;
  updated: number;
  errors: Array<{ event: RawEvent; reason: string }>;
}

/**
 * Servicio principal para gestión de eventos
 */
export class EventService {
  constructor(
    private readonly repository: IEventRepository,
    private readonly businessRules: EventBusinessRules
  ) {}

  /**
   * Verifica si un evento está en la blacklist
   * @param source - Fuente del evento (e.g., "livepass", "ticketmaster")
   * @param externalId - ID externo del evento
   * @returns true si está blacklisted, false si no
   */
  private async isBlacklisted(source: string, externalId?: string): Promise<boolean> {
    if (!externalId) {
      return false; // Si no tiene externalId, no puede estar blacklisted
    }

    // Usar raw SQL hasta que se regenere el Prisma client
    const result = (await prisma.$queryRawUnsafe(
      `SELECT id FROM event_blacklist WHERE source = ? AND externalId = ? LIMIT 1`,
      source,
      externalId
    )) as Array<{ id: string }>;

    return Array.isArray(result) && result.length > 0;
  }

  /**
   * Procesa eventos entrantes aplicando reglas de negocio:
   * 0. Filtrar eventos blacklisted (ocultos por usuario)
   * 1. Validación (campos requeridos, fechas, ubicación)
   * 2. Normalización (ciudad, país, categoría)
   * 3. Deduplicación (fuzzy matching con eventos existentes)
   * 4. Inserción o actualización
   *
   * @param rawEvents - Eventos crudos de fuentes externas
   * @returns Resumen del procesamiento
   */
  async processEvents(rawEvents: RawEvent[]): Promise<ProcessEventsResult> {
    const result: ProcessEventsResult = {
      accepted: 0,
      rejected: 0,
      duplicates: 0,
      updated: 0,
      errors: [],
    };

    const eventsToUpsert: Event[] = [];

    for (const rawEvent of rawEvents) {
      try {
        // 0. Verificar blacklist (US3.2)
        // IMPORTANTE: GenericWebScraper usa _source (no source)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const source = (rawEvent as any)._source || rawEvent.source || 'unknown';

        if (await this.isBlacklisted(source, rawEvent.externalId)) {
          result.rejected++;
          result.errors.push({
            event: rawEvent,
            reason: 'Evento en blacklist (oculto por usuario)',
          });
          continue;
        }
      } catch (error) {
        // Si falla la consulta de blacklist, continuar sin bloquear
        console.warn('[EventService] Error checking blacklist:', error);
      }

      // Continuar con validación normal

      try {
        // Convertir RawEvent a Event para validación
        const event = this.rawEventToEvent(rawEvent);

        // 1. Validar con business rules
        const validation = await this.businessRules.isAcceptable(event);
        if (!validation.valid) {
          result.rejected++;
          result.errors.push({
            event: rawEvent,
            reason: validation.reason || 'Validación fallida',
          });
          continue;
        }

        // 2. Normalizar datos
        const normalizedEvent = this.businessRules.normalize(event);

        // 3. Buscar duplicados en BD (fuzzy matching)
        const duplicate = await this.findDuplicate(normalizedEvent);

        if (duplicate) {
          result.duplicates++;

          // Decidir si actualizar
          if (this.businessRules.shouldUpdate(normalizedEvent, duplicate)) {
            eventsToUpsert.push(normalizedEvent);
            result.updated++;
          }
          // Si no debe actualizar, ignorar
        } else {
          // Evento nuevo, agregar para inserción
          eventsToUpsert.push(normalizedEvent);
          result.accepted++;
        }
      } catch (error) {
        result.errors.push({
          event: rawEvent,
          reason: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
    }

    // 4. Guardar en BD (batch)
    if (eventsToUpsert.length > 0) {
      await this.repository.upsertMany(eventsToUpsert);
    }

    return result;
  }

  /**
   * Busca un evento duplicado en la base de datos usando fuzzy matching
   *
   * Estrategia:
   * 1. Buscar eventos cercanos en fecha (±24 horas)
   * 2. Aplicar fuzzy matching en título y venue
   *
   * @param event - Evento a buscar
   * @returns Evento duplicado si existe, null si no
   */
  private async findDuplicate(event: Event): Promise<Event | null> {
    // Buscar eventos en rango de fecha (±24 horas)
    const dateFrom = new Date(event.date);
    dateFrom.setHours(dateFrom.getHours() - 24);

    const dateTo = new Date(event.date);
    dateTo.setHours(dateTo.getHours() + 24);

    const candidates = await this.repository.findByFilters({
      dateFrom,
      dateTo,
    });

    // Aplicar fuzzy matching a candidatos
    for (const candidate of candidates) {
      if (this.businessRules.isDuplicate(event, candidate)) {
        return candidate;
      }
    }

    return null;
  }

  /**
   * Convierte RawEvent a Event (agrega campos faltantes)
   */
  private rawEventToEvent(rawEvent: RawEvent): Event {
    // Convertir fecha si viene como string
    const date = typeof rawEvent.date === 'string' ? new Date(rawEvent.date) : rawEvent.date;
    const endDate = rawEvent.endDate
      ? typeof rawEvent.endDate === 'string'
        ? new Date(rawEvent.endDate)
        : rawEvent.endDate
      : undefined;

    return {
      id: rawEvent.externalId || `temp-${Date.now()}`,
      title: rawEvent.title,
      description: rawEvent.description,
      date: date,
      endDate: endDate,
      venueName: rawEvent.venue,
      city: rawEvent.city || '', // Será validado por business rules
      country: rawEvent.country || '', // Será validado por business rules
      category: (rawEvent.category as Event['category']) || 'Otro',
      genre: rawEvent.genre,
      artists: rawEvent.artists,
      imageUrl: rawEvent.imageUrl,
      ticketUrl: rawEvent.ticketUrl,
      price: rawEvent.price,
      priceMax: rawEvent.priceMax,
      currency: rawEvent.currency || 'ARS',
      venueCapacity: rawEvent.venueCapacity,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      source: (rawEvent as any)._source || rawEvent.source || 'unknown', // Fix: usar _source del scraper
      externalId: rawEvent.externalId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Convierte Event a RawEvent (para guardar en BD)
   * NOTA: Este método ya no se usa después de arreglar processEvents
   */
  private eventToRawEvent(event: Event): RawEvent {
    return {
      title: event.title,
      description: event.description,
      date: event.date,
      endDate: event.endDate,
      venue: event.venueName,
      city: event.city,
      country: event.country,
      category: event.category,
      genre: event.genre,
      artists: event.artists,
      imageUrl: event.imageUrl,
      ticketUrl: event.ticketUrl,
      price: event.price,
      priceMax: event.priceMax,
      currency: event.currency,
      source: event.source,
      externalId: event.externalId,
    };
  }

  /**
   * Busca eventos aplicando filtros (pasa directo al repository)
   */
  async findByFilters(filters: EventFilters): Promise<Event[]> {
    return this.repository.findByFilters(filters);
  }

  /**
   * Busca todos los eventos (pasa directo al repository)
   */
  async findAll(): Promise<Event[]> {
    return this.repository.findAll();
  }

  /**
   * Busca un evento por ID (pasa directo al repository)
   */
  async findById(id: string): Promise<Event | null> {
    return this.repository.findById(id);
  }
}
