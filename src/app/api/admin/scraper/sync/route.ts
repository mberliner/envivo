import { NextRequest, NextResponse } from 'next/server';
import { createEventRepository } from '@/shared/infrastructure/factories/service-factory';
import { DataSourceOrchestrator } from '@/features/events/data/orchestrator/DataSourceOrchestrator';
import { WebScraperFactory } from '@/features/events/data/sources/web/WebScraperFactory';
import { AllAccessJsonScraper } from '@/features/events/data/sources/AllAccessJsonScraper';
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

    // 2. Parsear parámetros opcionales del body
    let requestedSources: string[] = [];
    try {
      const body = await req.json();
      // Aceptar array de fuentes específicas a scrapear
      // Ej: { "sources": ["teatrovorterix", "allaccess"] }
      if (body.sources && Array.isArray(body.sources)) {
        requestedSources = body.sources;
      }
    } catch {
      // Body vacío o inválido - scrapear todas las fuentes
    }

    // 3. Configurar orchestrator
    const repository = createEventRepository();
    const orchestrator = new DataSourceOrchestrator(repository);

    // Fuentes disponibles
    const availableSources = [
      'livepass',
      'teatrocoliseo',
      'movistararena',
      'allaccess',
      'teatrovorterix',
    ];

    // Si no se especificaron fuentes, usar todas
    const sourcesToScrape = requestedSources.length > 0 ? requestedSources : availableSources;

    // Registrar solo las fuentes solicitadas
    for (const sourceName of sourcesToScrape) {
      switch (sourceName) {
        case 'livepass':
          // LivePass (Café Berlín)
          const livepassScraper = await WebScraperFactory.create('livepass');
          orchestrator.registerSource(livepassScraper);
          break;

        case 'teatrocoliseo':
          // Teatro Coliseo
          const teatroColiseoScraper = await WebScraperFactory.create('teatrocoliseo');
          orchestrator.registerSource(teatroColiseoScraper);
          break;

        case 'movistararena':
          // Movistar Arena
          const movistarArenaScraper = await WebScraperFactory.create('movistararena');
          orchestrator.registerSource(movistarArenaScraper);
          break;

        case 'allaccess':
          // AllAccess (JSON scraper)
          const allAccessScraper = new AllAccessJsonScraper();
          orchestrator.registerSource(allAccessScraper);
          break;

        case 'teatrovorterix':
          // Teatro Vorterix
          const teatroVorterixScraper = await WebScraperFactory.create('teatrovorterix');
          orchestrator.registerSource(teatroVorterixScraper);
          break;

        default:
          console.warn(`[API] Unknown source requested: ${sourceName}`);
      }
    }

    // TODO: Registrar más data sources cuando estén disponibles
    // Ejemplo:
    // const eventbriteSource = new EventBriteArgentinaSource();
    // orchestrator.registerSource(eventbriteSource);

    // 4. Ejecutar scraping (automáticamente valida, dedupl ica y guarda)
    const result = await orchestrator.fetchAll();

    // 5. Retornar resumen
    return NextResponse.json(
      {
        success: true,
        requestedSources: sourcesToScrape,
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
