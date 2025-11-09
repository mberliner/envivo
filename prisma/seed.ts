/**
 * Database Seed Script
 *
 * Puebla la base de datos con eventos realistas para desarrollo y testing
 * Usa los fixtures de mockEvents para garantizar consistencia
 *
 * Ejecutar:
 * npx tsx prisma/seed.ts
 */

import { PrismaClient } from '@prisma/client';
import { mockEvents } from '../src/test/fixtures/events.fixtures';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de base de datos...\n');

  // 1. Limpiar datos existentes (solo en desarrollo)
  console.log('🧹 Limpiando datos existentes...');
  await prisma.event.deleteMany();
  console.log('   ✓ Eventos eliminados\n');

  // 2. Crear eventos desde fixtures
  console.log('📝 Creando eventos desde fixtures...');
  let createdCount = 0;

  for (const mockEvent of mockEvents) {
    try {
      // Mapear el Event de dominio a formato de Prisma
      await prisma.event.create({
        data: {
          id: mockEvent.id,
          title: mockEvent.title,
          description: mockEvent.description || null,
          date: mockEvent.date,
          endDate: null, // Los fixtures no tienen endDate

          // Ubicación
          // venueName se guarda en la tabla Venue en producción,
          // pero por ahora lo omitimos y solo usamos city/country
          venueId: null,
          city: mockEvent.city,
          country: mockEvent.country,

          // Categorización
          category: mockEvent.category,
          genre: mockEvent.genre || null,

          // Información adicional
          imageUrl: mockEvent.imageUrl || null,
          ticketUrl: mockEvent.ticketUrl || null,

          // Precio - Convertir string a float si es necesario
          price: mockEvent.price ? parseFloat(mockEvent.price.replace(/[^0-9.-]/g, '')) : null,
          priceMax: mockEvent.priceMax
            ? parseFloat(mockEvent.priceMax.replace(/[^0-9.-]/g, ''))
            : null,
          currency: mockEvent.currency || 'ARS',

          // Metadatos
          source: mockEvent.source,
          externalId: null, // Fixtures no tienen externalId
        },
      });

      createdCount++;
      console.log(`   ✓ ${mockEvent.title}`);
    } catch (error) {
      console.error(`   ✗ Error creando evento "${mockEvent.title}":`, error);
    }
  }

  console.log(`\n✅ Seed completado: ${createdCount}/${mockEvents.length} eventos creados\n`);

  // 3. Mostrar resumen
  const total = await prisma.event.count();
  const cities = await prisma.event.groupBy({
    by: ['city'],
    _count: true,
  });
  const categories = await prisma.event.groupBy({
    by: ['category'],
    _count: true,
  });

  console.log('📊 Resumen de la base de datos:');
  console.log(`   Total de eventos: ${total}`);
  console.log(`\n   Eventos por ciudad:`);
  cities.forEach(c => {
    console.log(`   - ${c.city}: ${c._count} eventos`);
  });
  console.log(`\n   Eventos por categoría:`);
  categories.forEach(c => {
    console.log(`   - ${c.category}: ${c._count} eventos`);
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('\n🎉 Seed finalizado exitosamente\n');
  })
  .catch(async e => {
    console.error('❌ Error durante seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
