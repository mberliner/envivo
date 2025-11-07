import { NextRequest, NextResponse } from 'next/server';
import { TicketmasterSource } from '@/features/events/data/sources/ticketmaster/TicketmasterSource';
import { PrismaEventRepository } from '@/features/events/data/repositories/PrismaEventRepository';
import { env } from '@/shared/infrastructure/config/env';

/**
 * POST /api/admin/scraper/sync
 *
 * Ejecuta scraping manual de Ticketmaster y guarda eventos en BD
 *
 * Headers requeridos:
 * - x-api-key: ADMIN_API_KEY
 *
 * Body opcional (JSON):
 * - country?: string (default: 'AR')
 * - city?: string
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

    // 2. Parsear parámetros opcionales del body
    let country: string | undefined;
    let city: string | undefined;

    try {
      const body = await req.json();
      country = body.country;
      city = body.city;
    } catch {
      // Body vacío o inválido - usar defaults
    }

    // 3. Ejecutar scraping de Ticketmaster
    const ticketmasterSource = new TicketmasterSource();
    const rawEvents = await ticketmasterSource.fetch({ country, city });

    // 4. Guardar eventos en BD
    const repository = new PrismaEventRepository();
    const savedCount = await repository.upsertMany(rawEvents);

    // 5. Retornar resumen
    return NextResponse.json(
      {
        success: true,
        source: 'ticketmaster',
        eventsScraped: rawEvents.length,
        eventsSaved: savedCount,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Scraper sync error:', error);

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
