/**
 * API Endpoint: POST /api/admin/migrate-blacklist
 *
 * Aplica la migración de EventBlacklist (temporal - solo para dev)
 * IMPORTANTE: Eliminar este endpoint después de aplicar la migración
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/infrastructure/database/prisma';
import { env } from '@/shared/infrastructure/config/env';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación admin
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${env.ADMIN_API_KEY}`;

    if (authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Migration] Applying EventBlacklist migration...');

    // Verificar si la tabla ya existe
    const tableCheck = await prisma.$queryRaw<Array<{ name: string }>>`
      SELECT name FROM sqlite_master WHERE type='table' AND name='event_blacklist'
    `;

    if (tableCheck.length > 0) {
      console.log('[Migration] ⚠️  Table already exists, skipping');
      return NextResponse.json({
        success: true,
        message: 'Table already exists',
        alreadyApplied: true,
      });
    }

    // Crear tabla
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "event_blacklist" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "source" TEXT NOT NULL,
        "externalId" TEXT NOT NULL,
        "reason" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Crear índice único
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX "event_blacklist_source_externalId_key"
      ON "event_blacklist"("source", "externalId")
    `);

    // Crear índice de búsqueda
    await prisma.$executeRawUnsafe(`
      CREATE INDEX "event_blacklist_source_externalId_idx"
      ON "event_blacklist"("source", "externalId")
    `);

    console.log('[Migration] ✅ Migration applied successfully!');

    return NextResponse.json({
      success: true,
      message: 'EventBlacklist table created successfully',
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Migration] Error:', errorMessage);

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
