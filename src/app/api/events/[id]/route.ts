/**
 * API Endpoint: DELETE /api/events/:id
 *
 * Elimina un evento y lo agrega a la blacklist para evitar que regrese
 * en futuros scrapings.
 *
 * US3.2: Ocultar eventos no deseados
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/infrastructure/database/prisma';
import { Prisma } from '@prisma/client';
import { nanoid } from 'nanoid';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/events/:id
 *
 * Elimina un evento y lo blacklistea
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { id } = await context.params;

    // Buscar el evento antes de eliminarlo (necesitamos source + externalId)
    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        source: true,
        externalId: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Si el evento no tiene externalId, no podemos blacklistearlo
    // (esto no debería pasar en condiciones normales)
    if (!event.externalId) {
      console.warn(`[DeleteEvent] Event ${id} has no externalId, cannot blacklist`);

      // Solo eliminar el evento sin agregar a blacklist
      await prisma.event.delete({
        where: { id },
      });

      return NextResponse.json({
        success: true,
        message: 'Event deleted (no blacklist - missing externalId)',
        event: { id: event.id, title: event.title },
      });
    }

    // Usar transacción para garantizar atomicidad
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Agregar a blacklist usando raw SQL
      // Workaround: usar raw SQL hasta que se regenere el Prisma client
      await tx.$executeRawUnsafe(
        `INSERT INTO event_blacklist (id, source, externalId, reason, createdAt)
         VALUES (?, ?, ?, ?, ?)`,
        nanoid(),
        event.source,
        event.externalId!,
        'Usuario lo eliminó desde UI',
        new Date().toISOString()
      );

      // 2. Eliminar el evento (hard delete)
      await tx.event.delete({
        where: { id },
      });
    });

    console.log(`[DeleteEvent] ✅ Event deleted and blacklisted:`, {
      id: event.id,
      title: event.title,
      source: event.source,
      externalId: event.externalId,
    });

    return NextResponse.json({
      success: true,
      message: 'Event deleted and blacklisted successfully',
      event: {
        id: event.id,
        title: event.title,
        source: event.source,
        externalId: event.externalId,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[DeleteEvent] Error:', errorMessage);

    // Si el error es por duplicado en blacklist, está OK
    if (errorMessage.includes('UNIQUE constraint failed')) {
      return NextResponse.json({
        success: true,
        message: 'Event already blacklisted',
      });
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
