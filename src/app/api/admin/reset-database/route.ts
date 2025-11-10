/**
 * API Endpoint: POST /api/admin/reset-database
 *
 * Limpia TODA la base de datos (eventos, blacklist, etc.)
 * CUIDADO: Esta acción es irreversible!
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

    console.log('[ResetDatabase] ⚠️  Iniciando limpieza completa de la BD...');

    // Contar antes de borrar (convertir BigInt a Number para JSON)
    const blacklistCount = (await prisma.$queryRawUnsafe<any[]>('SELECT COUNT(*) as count FROM event_blacklist'))[0].count;

    const countsBefore = {
      events: await prisma.event.count(),
      blacklist: Number(blacklistCount), // BigInt -> Number
      venues: await prisma.venue.count(),
      artists: await prisma.artist.count(),
    };

    console.log('[ResetDatabase] Estado antes:', countsBefore);

    // Borrar en orden correcto (respetando foreign keys)

    // 1. Borrar relaciones event_artists
    await prisma.eventArtist.deleteMany({});

    // 2. Borrar eventos
    await prisma.event.deleteMany({});

    // 3. Borrar blacklist (raw SQL)
    await prisma.$executeRawUnsafe('DELETE FROM event_blacklist');

    // 4. Borrar venues (opcional)
    await prisma.venue.deleteMany({});

    // 5. Borrar artists (opcional)
    await prisma.artist.deleteMany({});

    console.log('[ResetDatabase] ✅ Base de datos limpiada exitosamente');

    return NextResponse.json({
      success: true,
      message: 'Base de datos limpiada completamente',
      deletedCounts: {
        events: countsBefore.events,
        blacklist: countsBefore.blacklist,
        venues: countsBefore.venues,
        artists: countsBefore.artists,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ResetDatabase] Error:', errorMessage);

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
