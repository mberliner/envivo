#!/usr/bin/env node
/**
 * Script de debugging para verificar blacklist
 */

require('dotenv').config({ path: '.env.local' });
const http = require('http');

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

console.log('🔍 Debugging Blacklist\n');
console.log('='.repeat(60));

// Crear un endpoint temporal para debugging
const debugEndpoint = `
const { prisma } = require('@/shared/infrastructure/database/prisma');

async function debug() {
  console.log('\\n1. Eventos en blacklist:');
  const blacklist = await prisma.$queryRawUnsafe(
    'SELECT * FROM event_blacklist'
  );
  console.log(JSON.stringify(blacklist, null, 2));

  console.log('\\n2. Eventos en Event (primeros 5):');
  const events = await prisma.event.findMany({
    take: 5,
    select: { id: true, title: true, source: true, externalId: true }
  });
  console.log(JSON.stringify(events, null, 2));
}

debug();
`;

console.log('\n📝 Para ver el estado actual de la base de datos:');
console.log('   Abrí una terminal Node.js y ejecutá esto:\n');
console.log('const { PrismaClient } = require("@prisma/client");');
console.log('const prisma = new PrismaClient();');
console.log('');
console.log('// Ver blacklist:');
console.log('prisma.$queryRawUnsafe("SELECT * FROM event_blacklist").then(console.log);');
console.log('');
console.log('// Ver eventos:');
console.log('prisma.event.findMany({ take: 3, select: { title: true, source: true, externalId: true } }).then(console.log);');
console.log('\n' + '='.repeat(60));

// Mejor: hacer requests HTTP al servidor
console.log('\n🔍 Verificando estado via API...\n');

function makeRequest(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: 'Parse error' });
        }
      });
    });

    req.on('error', () => {
      resolve({ error: 'Connection error' });
    });

    req.end();
  });
}

async function debug() {
  // Ver eventos actuales
  const eventsResponse = await makeRequest('/api/events?limit=100');

  if (eventsResponse.error) {
    console.log('❌ No se puede conectar al servidor');
    console.log('   Asegurate de ejecutar: npm run dev\n');
    return;
  }

  console.log(`📊 Total eventos en DB: ${eventsResponse.total}`);

  if (eventsResponse.events && eventsResponse.events.length > 0) {
    const firstEvent = eventsResponse.events[0];
    console.log('\n📋 Ejemplo de evento:');
    console.log(`   Title: ${firstEvent.title}`);
    console.log(`   Source: ${firstEvent.source}`);
    console.log(`   External ID: ${firstEvent.externalId}`);
  }

  console.log('\n💡 Para ver la blacklist, necesitamos un endpoint específico.');
  console.log('   Por ahora, verificá manualmente:\n');
  console.log('   1. El evento que eliminaste, ¿tiene source="livepass" o source="unknown"?');
  console.log('   2. ¿Cuál es su externalId exacto?\n');
}

debug();
