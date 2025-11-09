import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SearchService } from '@/features/events/domain/services/SearchService';
import { PrismaEventRepository } from '@/features/events/data/repositories/PrismaEventRepository';

/**
 * GET /api/events
 *
 * Búsqueda y filtrado de eventos
 *
 * Query params opcionales:
 * - q: string - Texto de búsqueda (título, descripción, venue)
 * - city: string - Ciudad
 * - category: string - Categoría
 * - dateFrom: string (ISO 8601) - Fecha desde
 * - dateTo: string (ISO 8601) - Fecha hasta
 * - limit: number - Límite de resultados (default: 50, max: 100)
 * - offset: number - Offset para paginación (default: 0)
 *
 * Ejemplo:
 * GET /api/events?q=metallica&city=Buenos Aires&limit=20
 */

// Zod schema para validación de query params
const searchQuerySchema = z.object({
  q: z.string().optional(),
  city: z.string().optional(),
  category: z.string().optional(),
  dateFrom: z.string().datetime().optional(), // ISO 8601 string
  dateTo: z.string().datetime().optional(), // ISO 8601 string
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(req: NextRequest) {
  try {
    // 1. Extraer query params de la URL
    const { searchParams } = new URL(req.url);

    // 2. Convertir searchParams a objeto
    const queryObject = {
      q: searchParams.get('q') ?? undefined,
      city: searchParams.get('city') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
    };

    // 3. Validar con Zod
    const validationResult = searchQuerySchema.safeParse(queryObject);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const validatedQuery = validationResult.data;

    // 4. Convertir strings de fecha a Date objects
    const searchQuery = {
      q: validatedQuery.q,
      city: validatedQuery.city,
      category: validatedQuery.category,
      dateFrom: validatedQuery.dateFrom ? new Date(validatedQuery.dateFrom) : undefined,
      dateTo: validatedQuery.dateTo ? new Date(validatedQuery.dateTo) : undefined,
      limit: validatedQuery.limit,
      offset: validatedQuery.offset,
    };

    // 5. Ejecutar búsqueda con SearchService
    const repository = new PrismaEventRepository();
    const searchService = new SearchService(repository);
    const result = await searchService.search(searchQuery);

    // 6. Retornar resultados
    return NextResponse.json(
      {
        events: result.events,
        total: result.total,
        hasMore: result.hasMore,
        limit: validatedQuery.limit,
        offset: validatedQuery.offset,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Search API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
