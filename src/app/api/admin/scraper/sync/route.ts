import { NextRequest, NextResponse } from 'next/server';
import { TicketmasterSource } from '@/features/events/data/sources/ticketmaster/TicketmasterSource';
import { PrismaEventRepository } from '@/features/events/data/repositories/PrismaEventRepository';
import { DataSourceOrchestrator } from '@/features/events/data/orchestrator/DataSourceOrchestrator';
import { env } from '@/shared/infrastructure/config/env';

/**
 * POST /api/admin/scraper/sync
 *
 * Ejecuta scraping manual usando DataSourceOrchestrator
 * Automáticamente valida, dedupl ica y guarda eventos en BD
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

    // 3. Configurar orchestrator con Ticketmaster
    const repository = new PrismaEventRepository();
    const orchestrator = new DataSourceOrchestrator(repository);

    // Registrar Ticketmaster source
    const ticketmasterSource = new TicketmasterSource();
    orchestrator.registerSource(ticketmasterSource);

    // 4. Ejecutar scraping (automáticamente valida, dedupl ica y guarda)
    const result = await orchestrator.fetchAll();

    // 5. Retornar resumen
    return NextResponse.json(
      {
        success: true,
        sources: result.sources,
        totalEvents: result.totalEvents,
        totalProcessed: result.totalProcessed,
        totalDuplicates: result.totalDuplicates,
        totalErrors: result.totalErrors,
        duration: result.duration,
        timestamp: result.timestamp.toISOString(),
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
