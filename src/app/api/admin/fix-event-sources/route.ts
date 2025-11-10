/**
 * API Endpoint: POST /api/admin/fix-event-sources
 *
 * Actualiza el source de todos los eventos de "unknown" a "livepass"
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/infrastructure/database/prisma';
import { env } from '@/shared/infrastructure/config/env';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${env.ADMIN_API_KEY}`;

    if (authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[FixEventSources] Actualizando source de eventos...');

    // Actualizar todos los eventos con source="unknown" a "livepass"
    // Basado en el externalId que contiene "/events/" (formato de LivePass)
    const result = await prisma.event.updateMany({
      where: {
        source: 'unknown',
        externalId: {
          contains: '/events/',
        },
      },
      data: {
        source: 'livepass',
      },
    });

    console.log(`[FixEventSources] ✅ ${result.count} eventos actualizados`);

    // También actualizar blacklist
    const blacklistResult: any = await prisma.$executeRawUnsafe(
      `UPDATE event_blacklist SET source = 'livepass' WHERE source = 'unknown'`
    );

    console.log(`[FixEventSources] ✅ ${blacklistResult} blacklist entries actualizadas`);

    return NextResponse.json({
      success: true,
      message: 'Event sources actualizados exitosamente',
      eventsUpdated: result.count,
      blacklistUpdated: blacklistResult,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[FixEventSources] Error:', errorMessage);

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
