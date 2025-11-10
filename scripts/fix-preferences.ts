/**
 * Fix global preferences to allow "Concierto" category
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPreferences() {
  console.log('🔧 Fixing global preferences...\n');

  try {
    // Upsert default preferences with correct allowedCategories
    const result = await prisma.globalPreferences.upsert({
      where: { id: 'singleton' },
      update: {
        allowedCategories: JSON.stringify(['Concierto', 'Festival', 'Teatro', 'Stand-up']),
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

    console.log('✅ Global preferences updated successfully!\n');
    console.log('Updated values:');
    console.log('  allowedCountries:', JSON.parse(result.allowedCountries));
    console.log('  allowedCities:', JSON.parse(result.allowedCities));
    console.log('  allowedCategories:', JSON.parse(result.allowedCategories));
    console.log('  allowedGenres:', JSON.parse(result.allowedGenres));

  } catch (error) {
    console.error('❌ Error fixing preferences:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPreferences();
