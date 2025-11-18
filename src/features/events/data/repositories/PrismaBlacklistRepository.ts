/**
 * PrismaBlacklistRepository
 *
 * Implementación de IBlacklistRepository usando Prisma ORM
 *
 * @module Data/Repositories
 */

import { IBlacklistRepository } from '../../domain/interfaces/IBlacklistRepository';
import { prisma } from '@/shared/infrastructure/database/prisma';
import { nanoid } from 'nanoid';

/**
 * Repositorio de blacklist usando Prisma
 */
export class PrismaBlacklistRepository implements IBlacklistRepository {
  /**
   * Verifica si un evento está en la blacklist
   * @param source - Fuente del evento (e.g., "livepass", "allaccess")
   * @param externalId - ID externo del evento en la fuente
   * @returns true si está blacklisted, false si no
   */
  async isBlacklisted(source: string, externalId: string): Promise<boolean> {
    try {
      // Usar raw SQL hasta que se regenere el Prisma client
      const result = (await prisma.$queryRawUnsafe(
        `SELECT id FROM event_blacklist WHERE source = ? AND externalId = ? LIMIT 1`,
        source,
        externalId
      )) as Array<{ id: string }>;

      return Array.isArray(result) && result.length > 0;
    } catch (error) {
      // Si hay error en BD, asumir que NO está blacklisted (fail-safe)
      console.warn('[PrismaBlacklistRepository] Error checking blacklist:', error);
      return false;
    }
  }

  /**
   * Agrega un evento a la blacklist
   * @param source - Fuente del evento
   * @param externalId - ID externo del evento
   * @param reason - Razón por la cual se blacklisteó
   */
  async addToBlacklist(source: string, externalId: string, reason: string): Promise<void> {
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO event_blacklist (id, source, externalId, reason, createdAt)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(source, externalId) DO NOTHING`,
        nanoid(),
        source,
        externalId,
        reason,
        new Date().toISOString()
      );
    } catch (error) {
      console.error('[PrismaBlacklistRepository] Error adding to blacklist:', error);
      throw error;
    }
  }

  /**
   * Limpia toda la blacklist
   * @returns Número de entradas eliminadas
   */
  async clearAll(): Promise<number> {
    try {
      const result = (await prisma.$queryRawUnsafe(
        'SELECT COUNT(*) as count FROM event_blacklist'
      )) as Array<{ count: bigint | number }>;
      const count = Number(result[0].count);

      await prisma.$executeRawUnsafe('DELETE FROM event_blacklist');

      return count;
    } catch (error) {
      console.error('[PrismaBlacklistRepository] Error clearing blacklist:', error);
      throw error;
    }
  }
}
