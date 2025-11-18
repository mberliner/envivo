/**
 * AdminService
 *
 * Servicio de dominio para operaciones administrativas:
 * - Eliminar eventos y blacklistearlos
 * - Limpiar base de datos completa
 *
 * Clean Architecture:
 * - Domain Layer coordina operaciones
 * - NO conoce implementaciones concretas (Prisma)
 * - Recibe repositorios por DI
 *
 * @module Domain/Services
 */

import { IEventRepository } from '../interfaces/IEventRepository';
import { IBlacklistRepository } from '../interfaces/IBlacklistRepository';

export interface DeleteEventResult {
  success: boolean;
  event: {
    id: string;
    title: string;
    source: string;
    externalId?: string;
  };
  blacklisted: boolean;
}

export interface ResetDatabaseResult {
  success: boolean;
  deletedCounts: {
    events: number;
    blacklist: number;
  };
}

/**
 * Servicio para operaciones administrativas
 */
export class AdminService {
  constructor(
    private readonly eventRepository: IEventRepository,
    private readonly blacklistRepository: IBlacklistRepository
  ) {}

  /**
   * Elimina un evento y lo agrega a la blacklist
   * para evitar que regrese en futuros scrapings
   *
   * @param eventId - ID del evento a eliminar
   * @returns Resultado de la operación
   */
  async deleteEventAndBlacklist(eventId: string): Promise<DeleteEventResult> {
    // 1. Buscar evento antes de eliminarlo (necesitamos metadata)
    const event = await this.eventRepository.findById(eventId);

    if (!event) {
      throw new Error('Event not found');
    }

    // 2. Si tiene externalId, blacklistear primero
    let blacklisted = false;
    if (event.externalId) {
      try {
        await this.blacklistRepository.addToBlacklist(
          event.source,
          event.externalId,
          'Usuario lo eliminó desde UI'
        );
        blacklisted = true;
      } catch (error) {
        // Si falla blacklist, continuar con delete
        console.warn('[AdminService] Failed to blacklist event:', error);
      }
    }

    // 3. Eliminar evento
    await this.eventRepository.deleteById(eventId);

    return {
      success: true,
      event: {
        id: event.id,
        title: event.title,
        source: event.source,
        externalId: event.externalId,
      },
      blacklisted,
    };
  }

  /**
   * Limpia TODA la base de datos (eventos y blacklist)
   * ⚠️ CUIDADO: Esta operación es irreversible
   *
   * @returns Resultado con contadores de items eliminados
   */
  async resetDatabase(): Promise<ResetDatabaseResult> {
    // 1. Eliminar eventos
    const deletedEvents = await this.eventRepository.deleteAll();

    // 2. Eliminar blacklist
    const deletedBlacklist = await this.blacklistRepository.clearAll();

    return {
      success: true,
      deletedCounts: {
        events: deletedEvents,
        blacklist: deletedBlacklist,
      },
    };
  }
}
