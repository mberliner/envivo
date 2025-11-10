#!/usr/bin/env node
/**
 * Verificar blacklist usando el API endpoint
 */

require('dotenv').config({ path: '.env.local' });
const http = require('http');

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

if (!ADMIN_API_KEY) {
  console.error('❌ ADMIN_API_KEY no configurado');
  process.exit(1);
}

console.log('🔍 Verificando blacklist via API...\n');

// Crear endpoint temporal para leer blacklist
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/events?limit=100',
  method: 'GET',
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const result = JSON.parse(data);

      console.log('✅ Verificación completada\n');
      console.log('📊 Estado actual:');
      console.log(`   • Total eventos en DB: ${result.total}`);
      console.log(`   • Eventos mostrados: ${result.events.length}\n`);

      // Buscar el evento que acabamos de eliminar
      const franco = result.events.find(e => e.title.includes('Franco Dezzutto'));

      if (franco) {
        console.log('❌ ERROR: El evento "Franco Dezzutto" todavía existe en Event');
        console.log('   Esto no debería pasar - verificá que se eliminó correctamente\n');
      } else {
        console.log('✅ Evento "Franco Dezzutto" eliminado correctamente de Event\n');
        console.log('📋 Próximos pasos:');
        console.log('   1. Ejecutá: node scripts/scrape-livepass.js');
        console.log('   2. Verificá que Franco Dezzutto NO regresa en el scraping\n');
      }

    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error conectando:', error.message);
});

req.end();
