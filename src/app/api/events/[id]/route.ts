/**
 * API Endpoint: DELETE /api/events/:id
 *
 * Elimina un evento y lo agrega a la blacklist para evitar que regrese
 * en futuros scrapings.
 *
 * US3.2: Ocultar eventos no deseados
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminService } from '@/shared/infrastructure/factories/service-factory';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/events/:id
 *
 * Elimina un evento y lo blacklistea
 */
export async function DELETE(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const { id } = await context.params;

    // Usar AdminService para manejar la operación
    const adminService = createAdminService();
    const result = await adminService.deleteEventAndBlacklist(id);

    console.log(`[DeleteEvent] ✅ Event deleted:`, result.event);

    return NextResponse.json({
      success: true,
      message: result.blacklisted
        ? 'Event deleted and blacklisted successfully'
        : 'Event deleted (no blacklist - missing externalId)',
      event: result.event,
      blacklisted: result.blacklisted,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[DeleteEvent] Error:', errorMessage);

    // Si el error es "Event not found", devolver 404
    if (errorMessage.includes('not found')) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
