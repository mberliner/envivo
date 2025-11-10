#!/usr/bin/env node
/**
 * Ver estado de blacklist y eventos
 */

require('dotenv').config({ path: '.env.local' });
const http = require('http');

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

if (!ADMIN_API_KEY) {
  console.error('❌ ADMIN_API_KEY no configurado');
  process.exit(1);
}

console.log('🔍 Debugging Blacklist...\n');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/debug-blacklist',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${ADMIN_API_KEY}`,
  },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const result = JSON.parse(data);

      if (result.success) {
        const { debug } = result;

        console.log('📊 Estado Actual:');
        console.log(`   Total eventos en DB: ${debug.totalEvents}`);
        console.log(`   Total en blacklist: ${debug.totalBlacklisted}\n`);

        if (debug.totalBlacklisted > 0) {
          console.log('⛔ Eventos en Blacklist:');
          console.log('─'.repeat(60));
          debug.blacklist.forEach((item, i) => {
            console.log(`${i + 1}. source: "${item.source}" | externalId: "${item.externalId}"`);
            console.log(`   reason: ${item.reason}`);
            console.log(`   createdAt: ${new Date(item.createdAt).toLocaleString('es-AR')}\n`);
          });
        } else {
          console.log('⚠️  Blacklist vacía - no hay eventos bloqueados\n');
        }

        console.log('📋 Últimos 5 Eventos en DB:');
        console.log('─'.repeat(60));
        debug.recentEvents.forEach((event, i) => {
          console.log(`${i + 1}. "${event.title}"`);
          console.log(`   source: "${event.source}" | externalId: "${event.externalId}"`);
          console.log('');
        });

        console.log('─'.repeat(60));
        console.log('\n💡 Comparación:');
        console.log('   - Si un evento está en blacklist Y en Event → BUG!');
        console.log('   - Si un evento está solo en blacklist → ✅ Correcto\n');

      } else {
        console.error('❌ Error:', result.error);
      }
    } catch (error) {
      console.error('❌ Error parsing:', error.message);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error conectando:', error.message);
  console.log('\n💡 Asegurate de ejecutar: npm run dev\n');
});

req.end();
