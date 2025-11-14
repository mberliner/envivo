// Prisma Client Singleton
// Prevents multiple instances in development (hot reload)

import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Usar DATABASE_URL_E2E si está disponible (para tests E2E)
// De lo contrario, usa DATABASE_URL (para desarrollo/producción)
const databaseUrl = process.env.DATABASE_URL_E2E || process.env.DATABASE_URL;

// Log de debug para ver qué BD se está usando (solo en desarrollo)
if (process.env.NODE_ENV === 'development' && process.env.DATABASE_URL_E2E) {
  console.log('[Prisma] Using E2E database:', databaseUrl);
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: databaseUrl
      ? {
          db: {
            url: databaseUrl,
          },
        }
      : undefined,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
