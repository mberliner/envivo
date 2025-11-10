/**
 * API Endpoint: POST /api/admin/clean-blacklist
 *
 * Limpia todos los registros de la blacklist
 * Útil para resetear después de arreglar el bug del source='unknown'
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

    console.log('[CleanBlacklist] Eliminando todos los registros de blacklist...');

    // Usar raw SQL para eliminar todos los registros
    const result: any = await prisma.$executeRawUnsafe(
      `DELETE FROM event_blacklist`
    );

    console.log(`[CleanBlacklist] ✅ ${result} registro(s) eliminado(s)`);

    return NextResponse.json({
      success: true,
      message: 'Blacklist limpiada exitosamente',
      deleted: result,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[CleanBlacklist] Error:', errorMessage);

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
