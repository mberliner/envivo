/**
 * E2E Database Helper
 *
 * Proporciona un PrismaClient configurado para usar la BD de E2E/integración.
 * Esta BD está completamente separada de la BD de desarrollo.
 *
 * IMPORTANTE: Solo para uso en endpoints /api/test/*
 */

import { PrismaClient } from '@prisma/client';

/**
 * Obtiene un PrismaClient configurado para la BD de E2E
 *
 * - Usa DATABASE_URL_E2E si está disponible
 * - Fallback a DATABASE_URL para compatibilidad con tests existentes
 * - Logs en modo desarrollo para debugging
 */
export function getE2EPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL_E2E || process.env.DATABASE_URL;

  if (process.env.NODE_ENV === 'development') {
    const dbType = process.env.DATABASE_URL_E2E ? 'E2E' : 'Development (fallback)';
    console.log(`[E2E DB] Using ${dbType} database: ${databaseUrl}`);
  }

  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}
