/**
 * API Endpoint: POST /api/admin/reset-database
 *
 * Limpia TODA la base de datos (eventos, blacklist, etc.)
 * CUIDADO: Esta acción es irreversible!
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminService } from '@/shared/infrastructure/factories/service-factory';
import { env } from '@/shared/infrastructure/config/env';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${env.ADMIN_API_KEY}`;

    if (authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[ResetDatabase] ⚠️  Iniciando limpieza completa de la BD...');

    // Usar AdminService para manejar la operación
    const adminService = createAdminService();
    const result = await adminService.resetDatabase();

    console.log('[ResetDatabase] ✅ Base de datos limpiada exitosamente');
    console.log('[ResetDatabase] Deleted:', result.deletedCounts);

    return NextResponse.json({
      success: true,
      message: 'Base de datos limpiada completamente',
      deletedCounts: result.deletedCounts,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ResetDatabase] Error:', errorMessage);

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
