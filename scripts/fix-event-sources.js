#!/usr/bin/env node
/**
 * Actualizar source de eventos de "unknown" a "livepass"
 */

require('dotenv').config({ path: '.env.local' });
const http = require('http');

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

if (!ADMIN_API_KEY) {
  console.error('❌ ADMIN_API_KEY no configurado');
  process.exit(1);
}

console.log('🔧 Actualizando source de eventos...\n');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/fix-event-sources',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${ADMIN_API_KEY}`,
    'Content-Type': 'application/json',
  },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const result = JSON.parse(data);

      if (result.success) {
        console.log('✅ Source actualizado exitosamente!\n');
        console.log(`📊 Resultados:`);
        console.log(`   • Eventos actualizados: ${result.eventsUpdated}`);
        console.log(`   • Blacklist actualizada: ${result.blacklistUpdated}\n`);
        console.log('📝 Próximos pasos:');
        console.log('   1. Ejecutá: node scripts/debug-blacklist-simple.js');
        console.log('   2. Verificá que ahora dice source: "livepass"');
        console.log('   3. Ejecutá scraping: node scripts/scrape-livepass.js');
        console.log('   4. El evento eliminado NO debe regresar ✅\n');
      } else {
        console.error('❌ Error:', result.error);
      }
    } catch (error) {
      console.error('❌ Error parsing:', error.message);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
  console.log('💡 Asegurate de ejecutar: npm run dev\n');
});

req.end();
