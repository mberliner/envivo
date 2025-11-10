/**
 * API Endpoint: GET /api/admin/debug-blacklist
 *
 * Debugging endpoint para ver estado de blacklist y eventos
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/infrastructure/database/prisma';
import { env } from '@/shared/infrastructure/config/env';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${env.ADMIN_API_KEY}`;

    if (authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[DebugBlacklist] Gathering debug info...');

    // 1. Ver blacklist
    const blacklist: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM event_blacklist ORDER BY createdAt DESC`
    );

    // 2. Ver eventos (primeros 5)
    const events = await prisma.event.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        source: true,
        externalId: true,
        createdAt: true,
      },
    });

    // 3. Contar totales
    const totalEvents = await prisma.event.count();
    const totalBlacklisted = blacklist.length;

    return NextResponse.json({
      success: true,
      debug: {
        totalEvents,
        totalBlacklisted,
        blacklist,
        recentEvents: events,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[DebugBlacklist] Error:', errorMessage);

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
