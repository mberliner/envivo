/**
 * API Endpoint: POST /api/admin/fix-preferences
 *
 * Fixes global preferences to allow "Concierto" category
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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Fix Preferences] Updating global preferences...');

    // Upsert default preferences with correct allowedCategories
    const result = await prisma.globalPreferences.upsert({
      where: { id: 'singleton' },
      update: {
        allowedCategories: JSON.stringify(['Concierto', 'Festival', 'Teatro', 'Stand-up']),
        updatedAt: new Date(),
      },
      create: {
        id: 'singleton',
        allowedCountries: JSON.stringify(['AR', 'UY', 'CL', 'BR']),
        allowedCities: JSON.stringify(['Buenos Aires', 'Ciudad de Buenos Aires', 'CABA', 'Montevideo', 'Santiago']),
        allowedGenres: JSON.stringify(['Rock', 'Pop', 'Jazz', 'Metal', 'Indie', 'Electrónica']),
        blockedGenres: JSON.stringify([]),
        allowedCategories: JSON.stringify(['Concierto', 'Festival', 'Teatro', 'Stand-up']),
        allowedVenueSizes: JSON.stringify(['small', 'medium', 'large']),
        venueSizeThresholds: JSON.stringify({ small: 500, medium: 2000, large: 5000 }),
        needsRescraping: false,
        updatedAt: new Date(),
      },
    });

    console.log('[Fix Preferences] ✅ Preferences updated successfully!');

    return NextResponse.json({
      success: true,
      preferences: {
        allowedCountries: JSON.parse(result.allowedCountries),
        allowedCities: JSON.parse(result.allowedCities),
        allowedCategories: JSON.parse(result.allowedCategories),
        allowedGenres: JSON.parse(result.allowedGenres),
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Fix Preferences] Error:', errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
