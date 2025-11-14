import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { env } from '@/shared/infrastructure/config/env';

const prisma = new PrismaClient();

/**
 * DELETE /api/test/cleanup
 *
 * Limpia TODOS los datos de prueba E2E
 *
 * Elimina:
 * - Eventos con título que empieza con "[E2E-TEST]"
 * - Eventos con source "E2E-TEST"
 * - Entradas en blacklist de estos eventos
 *
 * IMPORTANTE: Solo disponible en desarrollo/testing
 * Requiere ADMIN_API_KEY
 *
 * Response:
 * {
 *   success: true,
 *   deleted: {
 *     events: number,
 *     blacklisted: number
 *   }
 * }
 */
export async function DELETE(request: NextRequest) {
  // Validar API key
  const apiKey = request.headers.get('x-api-key');

  if (!env.ADMIN_API_KEY) {
    return NextResponse.json(
      { error: 'Admin API key not configured in server' },
      { status: 500 }
    );
  }

  if (!apiKey || apiKey !== env.ADMIN_API_KEY) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid or missing API key' },
      { status: 401 }
    );
  }

  // Solo permitir en desarrollo/testing
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production') {
    return NextResponse.json(
      { error: 'Endpoint not available in production' },
      { status: 403 }
    );
  }

  try {
    // Encontrar todos los eventos de prueba
    const testEvents = await prisma.event.findMany({
      where: {
        OR: [
          { title: { startsWith: '[E2E-TEST]' } },
          { source: 'E2E-TEST' },
        ],
      },
      select: { id: true, externalId: true },
    });

    const testExternalIds = testEvents
      .map((e: { externalId: string | null }) => e.externalId)
      .filter((id): id is string => id !== null);

    // Eliminar de blacklist primero (si existen)
    // El modelo se llama EventBlacklist y usa source + externalId
    const deletedBlacklisted = await prisma.eventBlacklist.deleteMany({
      where: {
        AND: [
          { source: 'E2E-TEST' },
          { externalId: { in: testExternalIds } },
        ],
      },
    });

    // Eliminar eventos de prueba
    const deletedEvents = await prisma.event.deleteMany({
      where: {
        OR: [
          { title: { startsWith: '[E2E-TEST]' } },
          { source: 'E2E-TEST' },
        ],
      },
    });

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${deletedEvents.count} test events and ${deletedBlacklisted.count} blacklist entries`,
      deleted: {
        events: deletedEvents.count,
        blacklisted: deletedBlacklisted.count,
      },
    });
  } catch (error) {
    console.error('Error cleaning up test data:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup test data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
