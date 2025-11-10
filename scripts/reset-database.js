#!/usr/bin/env node
/**
 * Resetear completamente la base de datos
 *
 * ⚠️  CUIDADO: Esta acción es IRREVERSIBLE!
 * Borra TODOS los eventos, blacklist, venues y artists.
 */

require('dotenv').config({ path: '.env.local' });
const http = require('http');

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

if (!ADMIN_API_KEY) {
  console.error('❌ ADMIN_API_KEY no configurado');
  process.exit(1);
}

console.log('⚠️  ¡ATENCIÓN! Esta acción borrará TODA la base de datos.\n');
console.log('📋 Se borrarán:');
console.log('   • Todos los eventos');
console.log('   • Toda la blacklist');
console.log('   • Todos los venues');
console.log('   • Todos los artists\n');
console.log('🔧 Iniciando reset de la base de datos...\n');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/reset-database',
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
        console.log('✅ Base de datos reseteada exitosamente!\n');
        console.log('📊 Registros eliminados:');
        console.log(`   • Eventos: ${result.deletedCounts.events}`);
        console.log(`   • Blacklist: ${result.deletedCounts.blacklist}`);
        console.log(`   • Venues: ${result.deletedCounts.venues}`);
        console.log(`   • Artists: ${result.deletedCounts.artists}\n`);
        console.log('📝 Próximos pasos para probar el circuito completo:');
        console.log('   1. Ejecutá: node scripts/scrape-livepass.js');
        console.log('      → Deberías ver ~61 eventos con source: "livepass"');
        console.log('   2. Abrí http://localhost:3000');
        console.log('      → Click en la X roja de algún evento para eliminarlo');
        console.log('   3. Ejecutá: node scripts/debug-blacklist-simple.js');
        console.log('      → Verificá que el evento está en la blacklist');
        console.log('   4. Ejecutá: node scripts/scrape-livepass.js nuevamente');
        console.log('      → Deberías ver "Errores: 1" (evento blacklisteado)');
        console.log('   5. Refrescá http://localhost:3000');
        console.log('      → El evento eliminado NO debe aparecer ✅\n');
      } else {
        console.error('❌ Error:', result.error);
      }
    } catch (error) {
      console.error('❌ Error parsing response:', error.message);
      console.log('Response data:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
  console.log('💡 Asegurate de que el servidor esté corriendo: npm run dev\n');
});

req.end();
