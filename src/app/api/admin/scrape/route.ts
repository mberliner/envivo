/**
 * API Endpoint: POST /api/admin/scrape
 *
 * Ejecuta el scraping manual de todas las fuentes configuradas.
 * Requiere autenticación admin.
 */

import { NextRequest, NextResponse } from 'next/server';
import { DataSourceOrchestrator } from '@/features/events/data/orchestrator/DataSourceOrchestrator';
import { PrismaEventRepository } from '@/features/events/data/repositories/PrismaEventRepository';
import { GenericWebScraper } from '@/features/events/data/sources/web/GenericWebScraper';
import { livepassConfig } from '@/config/scrapers/livepass.config';
import { prisma } from '@/shared/infrastructure/database/prisma';
import { env } from '@/shared/infrastructure/config/env';

/**
 * POST /api/admin/scrape
 *
 * Ejecuta scraping manual de LivePass (Café Berlín)
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación admin
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${env.ADMIN_API_KEY}`;

    if (authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Crear orchestrator
    const repository = new PrismaEventRepository(prisma);
    const orchestrator = new DataSourceOrchestrator(repository);

    // Registrar LivePass scraper
    const livepassScraper = new GenericWebScraper(livepassConfig);
    orchestrator.registerSource(livepassScraper);

    console.log('[Scraper] Starting manual scrape for LivePass (Café Berlín)...');

    // Ejecutar scraping
    const result = await orchestrator.fetchAll();

    console.log('[Scraper] Scraping completed:', {
      totalEvents: result.totalEvents,
      totalProcessed: result.totalProcessed,
      totalDuplicates: result.totalDuplicates,
      totalErrors: result.totalErrors,
      duration: `${result.duration}ms`,
    });

    // Log first 5 errors for debugging
    if (result.totalErrors > 0 && result.errors.length > 0) {
      console.log('[Scraper] First 5 errors:');
      result.errors.slice(0, 5).forEach((err, i) => {
        console.log(`  ${i + 1}. "${err.event?.title || 'Unknown'}": ${err.reason}`);
      });
    }

    return NextResponse.json({
      success: true,
      result: {
        sources: result.sources,
        totalEvents: result.totalEvents,
        totalProcessed: result.totalProcessed,
        totalDuplicates: result.totalDuplicates,
        totalErrors: result.totalErrors,
        duration: result.duration,
        timestamp: result.timestamp,
        // Include first 5 errors in response for debugging
        errors: result.errors.slice(0, 5).map((e) => ({
          title: e.event?.title || 'Unknown',
          reason: e.reason,
        })),
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Scraper] Error during scraping:', errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
