import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { env } from '@/shared/infrastructure/config/env';

const prisma = new PrismaClient();

/**
 * DELETE /api/test/cleanup
 *
 * Limpia datos de prueba E2E de un suite específico
 *
 * Query params:
 * - prefix: Prefijo del suite (default: 'E2E-TEST')
 *
 * Elimina:
 * - Eventos con título que empieza con "[prefix]"
 * - Eventos con source "prefix"
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
  const { searchParams } = new URL(request.url);
  const prefix = searchParams.get('prefix') || 'E2E-TEST';
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
    // Encontrar todos los eventos de prueba con este prefix
    const testEvents = await prisma.event.findMany({
      where: {
        OR: [
          { title: { startsWith: `[${prefix}]` } },
          { source: prefix },
        ],
      },
      select: { id: true, externalId: true },
    });

    const testExternalIds = testEvents
      .map((e: { externalId: string | null }) => e.externalId)
      .filter((id: string | null): id is string => id !== null);

    // Eliminar de blacklist primero (si existen)
    // El modelo se llama EventBlacklist y usa source + externalId
    const deletedBlacklisted = await prisma.eventBlacklist.deleteMany({
      where: {
        AND: [
          { source: prefix },
          { externalId: { in: testExternalIds } },
        ],
      },
    });

    // Eliminar eventos de prueba
    const deletedEvents = await prisma.event.deleteMany({
      where: {
        OR: [
          { title: { startsWith: `[${prefix}]` } },
          { source: prefix },
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
