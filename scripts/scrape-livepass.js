#!/usr/bin/env node
/**
 * Script para ejecutar el scraping de LivePass (Café Berlín)
 * Uso: node scripts/scrape-livepass.js
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const http = require('http');

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

if (!ADMIN_API_KEY) {
  console.error('❌ Error: ADMIN_API_KEY no está configurado en .env');
  process.exit(1);
}

console.log('🔧 Fixing preferences first...\n');

// First, fix preferences
const fixReq = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/fix-preferences',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${ADMIN_API_KEY}`,
    'Content-Type': 'application/json',
  },
}, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      if (result.success) {
        console.log('✅ Preferences fixed!');
        console.log('   allowedCategories:', result.preferences.allowedCategories);
        console.log('');
        console.log('⚠️  IMPORTANTE: Debes reiniciar el servidor para que el cache se actualice:');
        console.log('   1. Presiona Ctrl+C en la terminal donde corre "npm run dev"');
        console.log('   2. Ejecuta "npm run dev" de nuevo');
        console.log('   3. Vuelve a ejecutar este script\n');
        process.exit(0);
      } else {
        console.error('❌ Failed to fix preferences:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error parsing fix-preferences response:', error.message);
      process.exit(1);
    }
  });
});

fixReq.on('error', (error) => {
  console.error('❌ Error fixing preferences:', error.message);
  process.exit(1);
});

fixReq.end();

function runScraping() {

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/scrape',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${ADMIN_API_KEY}`,
    'Content-Type': 'application/json',
  },
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);

      if (result.success) {
        console.log('✅ Scraping completado exitosamente!\n');
        console.log('📊 Resultados:');
        console.log(`   • Total eventos scrapeados: ${result.result.totalEvents}`);
        console.log(`   • Eventos procesados: ${result.result.totalProcessed}`);
        console.log(`   • Duplicados detectados: ${result.result.totalDuplicates}`);
        console.log(`   • Errores: ${result.result.totalErrors}`);
        console.log(`   • Duración: ${result.result.duration}ms`);
        console.log('\n📋 Detalle por fuente:');

        result.result.sources.forEach(source => {
          const status = source.success ? '✅' : '❌';
          console.log(`   ${status} ${source.name}: ${source.eventsCount} eventos (${source.duration}ms)`);
          if (source.error) {
            console.log(`      Error: ${source.error}`);
          }
        });
      } else {
        console.error('❌ Error en el scraping:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error parseando respuesta:', error.message);
      console.error('Respuesta:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  if (error.code === 'ECONNREFUSED') {
    console.error('❌ Error: No se puede conectar al servidor en http://localhost:3000');
    console.error('   Asegúrate de ejecutar "npm run dev" primero en otra terminal');
  } else {
    console.error('❌ Error:', error.message);
  }
  process.exit(1);
});

req.end();

} // End of runScraping function
