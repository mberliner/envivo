import { NextRequest, NextResponse } from 'next/server';
import { createAdminService } from '@/shared/infrastructure/factories/service-factory';
import { env } from '@/shared/infrastructure/config/env';

/**
 * POST /api/admin/events/cleanup
 *
 * Elimina todos los eventos pasados (anteriores al día actual).
 * Útil para mantenimiento y para liberar espacio en la base de datos.
 *
 * Headers requeridos:
 * - x-api-key: ADMIN_API_KEY
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verificar autenticación
    const apiKey = req.headers.get('x-api-key');

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

    // 2. Ejecutar limpieza
    const adminService = createAdminService();
    const deletedCount = await adminService.deletePastEvents();

    // 3. Retornar resultado
    return NextResponse.json(
      {
        success: true,
        message: `Successfully deleted ${deletedCount} past events`,
        deletedCount,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cleanup events error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
