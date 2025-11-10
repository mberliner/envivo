#!/usr/bin/env node
/**
 * Limpiar blacklist incorrecta (con source='unknown')
 */

require('dotenv').config({ path: '.env.local' });
const http = require('http');

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

if (!ADMIN_API_KEY) {
  console.error('❌ ADMIN_API_KEY no configurado');
  process.exit(1);
}

console.log('🧹 Limpiando blacklist incorrecta...\n');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/clean-blacklist',
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
        console.log('✅ Blacklist limpiada exitosamente!');
        console.log(`   Registros eliminados: ${result.deleted}\n`);
        console.log('📝 Próximos pasos:');
        console.log('   1. Reiniciar servidor: Ctrl+C -> npm run dev');
        console.log('   2. Ejecutar scraping: node scripts/scrape-livepass.js');
        console.log('   3. Probar eliminación de eventos desde UI\n');
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
});

req.end();
