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

console.log('🔧 Checking preferences...\n');

// Check and fix preferences if needed
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
        console.log('✅ Preferences OK!');
        console.log('   allowedCategories:', result.preferences.allowedCategories);
        console.log('');

        // Check if "Concierto" is in allowed categories
        const hasConcierto = result.preferences.allowedCategories.includes('Concierto');

        if (hasConcierto) {
          console.log('🚀 Iniciando scraping de LivePass (Café Berlín)...\n');
          runScraping();
        } else {
          console.log('⚠️  Error: "Concierto" no está en allowedCategories.');
          console.log('   Esto no debería pasar. Por favor reinicia el servidor.\n');
          process.exit(1);
        }
      } else {
        console.error('❌ Failed to check preferences:', result.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error parsing fix-preferences response:', error.message);
      process.exit(1);
    }
  });
});

fixReq.on('error', (error) => {
  console.error('❌ Error checking preferences:', error.message);
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
