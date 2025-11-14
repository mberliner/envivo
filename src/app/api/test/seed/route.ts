import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { env } from '@/shared/infrastructure/config/env';

const prisma = new PrismaClient();

/**
 * POST /api/test/seed
 *
 * Crea datos de prueba para tests E2E
 *
 * IMPORTANTE: Solo disponible en desarrollo/testing
 * Requiere ADMIN_API_KEY
 *
 * Body:
 * {
 *   count?: number  // Número de eventos a crear (default: 3)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   events: Event[]
 * }
 */
export async function POST(request: NextRequest) {
  // Validar API key
  const apiKey = request.headers.get('x-api-key');

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

  // Solo permitir en desarrollo/testing
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production') {
    return NextResponse.json(
      { error: 'Endpoint not available in production' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const count = body.count || 3;

    // Crear eventos de prueba con prefijo [E2E-TEST]
    const events = [];
    const timestamp = Date.now();

    for (let i = 0; i < count; i++) {
      const event = await prisma.event.create({
        data: {
          // Identificador único basado en timestamp
          title: `[E2E-TEST] Evento de Prueba ${timestamp}-${i}`,
          description: `Descripción del evento de prueba ${i}. Este evento fue creado automáticamente por el sistema de testing E2E.`,
          date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000), // i+1 días en el futuro

          // Ubicación (sin venue - solo city/country)
          city: 'Buenos Aires',
          country: 'Argentina',

          // Categoría y género
          category: 'Concierto',
          genre: i % 3 === 0 ? 'Rock' : i % 3 === 1 ? 'Pop' : 'Jazz',

          // Precio
          price: 1000 + (i * 500),
          priceMax: 2000 + (i * 500),
          currency: 'ARS',

          // URL de imagen (placeholder)
          imageUrl: `https://picsum.photos/seed/test-${timestamp}-${i}/800/600`,

          // URL de tickets (opcional)
          ticketUrl: i % 2 === 0 ? `https://example.com/tickets/test-${timestamp}-${i}` : null,

          // Source
          source: 'E2E-TEST',
          externalId: `test-${timestamp}-${i}`,
        },
      });

      events.push(event);
    }

    return NextResponse.json({
      success: true,
      message: `Created ${events.length} test events`,
      events,
    });
  } catch (error) {
    console.error('Error creating test events:', error);
    return NextResponse.json(
      { error: 'Failed to create test events', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
