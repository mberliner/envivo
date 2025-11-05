/**
 * Prisma Client Singleton
 *
 * Crea una instancia única de Prisma Client para evitar múltiples conexiones
 * en desarrollo (hot reload).
 *
 * @module Infrastructure/Database
 */

import { PrismaClient } from '@prisma/client';

// Declaración global para TypeScript
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Instancia singleton de Prisma Client
 */
export const prisma =
  global.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

// En desarrollo, guardar la instancia en global para evitar múltiples conexiones
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * Desconecta Prisma Client (útil para testing y graceful shutdown)
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
