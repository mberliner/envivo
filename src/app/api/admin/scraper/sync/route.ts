import { NextRequest, NextResponse } from 'next/server';
import { PrismaEventRepository } from '@/features/events/data/repositories/PrismaEventRepository';
import { DataSourceOrchestrator } from '@/features/events/data/orchestrator/DataSourceOrchestrator';
import { WebScraperFactory } from '@/features/events/data/sources/web/WebScraperFactory';
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
 *
 * NOTA: Actualmente no hay data sources registrados.
 * Para agregar nuevas fuentes (AllAccess, EventBrite Argentina, etc.):
 * 1. Crear el data source en src/features/events/data/sources/
 * 2. Importarlo aquí
 * 3. Registrarlo con orchestrator.registerSource()
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

    // 2. Parsear parámetros opcionales del body (actualmente no se usan)
    try {
      await req.json();
      // En el futuro, se podrían usar parámetros como country y city
    } catch {
      // Body vacío o inválido - usar defaults
    }

    // 3. Configurar orchestrator
    const repository = new PrismaEventRepository();
    const orchestrator = new DataSourceOrchestrator(repository);

    // Registrar web scrapers
    // LivePass (Café Berlín)
    const livepassScraper = await WebScraperFactory.create('livepass');
    orchestrator.registerSource(livepassScraper);

    // Teatro Coliseo
    const teatroColiseoScraper = await WebScraperFactory.create('teatrocoliseo');
    orchestrator.registerSource(teatroColiseoScraper);

    // Movistar Arena
    const movistarArenaScraper = await WebScraperFactory.create('movistararena');
    orchestrator.registerSource(movistarArenaScraper);

    // TODO: Registrar más data sources cuando estén disponibles
    // Ejemplo:
    // const allAccessSource = new AllAccessSource();
    // orchestrator.registerSource(allAccessSource);
    //
    // const eventbriteSource = new EventBriteArgentinaSource();
    // orchestrator.registerSource(eventbriteSource);

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
