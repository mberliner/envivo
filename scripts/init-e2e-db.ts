/**
 * Script de Inicialización de BD E2E
 *
 * Crea y configura la base de datos de integración/E2E.
 * Esta BD está completamente separada de la BD de desarrollo.
 *
 * Uso:
 *   npm run db:e2e:init
 *
 * NOTA: Este script requiere que Prisma ya esté configurado.
 * Si Prisma no puede descargar engines, ejecuta manualmente:
 *   DATABASE_URL=file:./e2e.db npx prisma db push
 */

import { PrismaClient } from '@prisma/client';

async function initE2EDatabase() {
  console.log('🔧 Inicializando base de datos E2E...\n');

  const databaseUrl = process.env.DATABASE_URL_E2E || 'file:./e2e.db';

  console.log(`📊 Database URL: ${databaseUrl}`);
  console.log('\n⚠️  IMPORTANTE: Este script verifica la conexión a la BD E2E.');
  console.log('Si la BD no existe, créala primero con:');
  console.log(`  DATABASE_URL="${databaseUrl}" npx prisma db push\n`);

  try {
    // Crear PrismaClient para BD E2E
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: ['error', 'warn'],
    });

    // Test de conexión
    console.log('🔍 Verificando conexión...');
    await prisma.$connect();

    // Verificar tablas
    const eventCount = await prisma.event.count();
    const blacklistCount = await prisma.eventBlacklist.count();

    console.log('\n✅ Base de datos E2E está lista:');
    console.log(`   📊 Eventos: ${eventCount}`);
    console.log(`   🚫 Blacklist: ${blacklistCount}`);

    await prisma.$disconnect();

    console.log('\n🎉 ¡Perfecto! La base de datos E2E está funcionando.\n');
    console.log('Próximos pasos:');
    console.log('  1. Ejecutar tests E2E: npm run test:e2e');
    console.log('  2. Ejecutar tests E2E en modo prod: npm run test:e2e:prod');
    console.log('\nNota: Los tests crearán y limpiarán sus propios datos automáticamente.\n');
  } catch (error) {
    console.error('\n❌ Error verificando base de datos E2E:');
    console.error(error instanceof Error ? error.message : error);
    console.error('\n💡 Solución: Crea el esquema manualmente con:');
    console.error(`   DATABASE_URL="${databaseUrl}" npx prisma db push\n`);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initE2EDatabase();
}

export { initE2EDatabase };
