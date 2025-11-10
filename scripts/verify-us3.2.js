#!/usr/bin/env node
/**
 * Script de Verificación: US3.2 - Ocultar Eventos No Deseados
 *
 * Verifica que la implementación de blacklist funciona correctamente
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const http = require('http');

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

if (!ADMIN_API_KEY) {
  console.error('❌ Error: ADMIN_API_KEY no está configurado');
  process.exit(1);
}

console.log('🔍 Verificación de US3.2: Ocultar Eventos No Deseados\n');
console.log('=' .repeat(60));

// Paso 1: Verificar que la tabla existe
function checkTableExists() {
  return new Promise((resolve, reject) => {
    console.log('\n📋 Paso 1: Verificando que tabla event_blacklist existe...');

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/migrate-blacklist',
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
            if (result.alreadyApplied) {
              console.log('   ✅ Tabla "event_blacklist" ya existe');
            } else {
              console.log('   ✅ Tabla "event_blacklist" creada exitosamente');
            }
            resolve(true);
          } else {
            console.log('   ❌ Error:', result.error);
            resolve(false);
          }
        } catch (error) {
          console.log('   ❌ Error parseando respuesta');
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log('   ❌ Error conectando al servidor:', error.message);
      resolve(false);
    });

    req.end();
  });
}

// Paso 2: Obtener un evento para probar
function getTestEvent() {
  return new Promise((resolve, reject) => {
    console.log('\n📋 Paso 2: Obteniendo un evento para probar...');

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/events?limit=1',
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.events && result.events.length > 0) {
            const event = result.events[0];
            console.log(`   ✅ Evento encontrado: "${event.title}"`);
            console.log(`      ID: ${event.id}`);
            console.log(`      Source: ${event.source}`);
            console.log(`      External ID: ${event.externalId || 'N/A'}`);
            resolve(event);
          } else {
            console.log('   ⚠️  No hay eventos en la base de datos');
            console.log('   💡 Ejecuta "node scripts/scrape-livepass.js" primero');
            resolve(null);
          }
        } catch (error) {
          console.log('   ❌ Error parseando respuesta');
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.log('   ❌ Error:', error.message);
      resolve(null);
    });

    req.end();
  });
}

// Paso 3: Eliminar el evento (simular click en UI)
function deleteEvent(eventId) {
  return new Promise((resolve, reject) => {
    console.log('\n📋 Paso 3: Probando eliminación del evento...');

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/events/${eventId}`,
      method: 'DELETE',
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.success) {
            console.log('   ✅ Evento eliminado exitosamente');
            console.log(`      Título: ${result.event.title}`);
            console.log(`      Agregado a blacklist: ${result.event.source}/${result.event.externalId}`);
            resolve(result.event);
          } else {
            console.log('   ❌ Error eliminando evento:', result.error);
            resolve(null);
          }
        } catch (error) {
          console.log('   ❌ Error parseando respuesta:', error.message);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.log('   ❌ Error:', error.message);
      resolve(null);
    });

    req.end();
  });
}

// Paso 4: Verificar que el evento no existe en la BD
function verifyEventDeleted(eventId) {
  return new Promise((resolve, reject) => {
    console.log('\n📋 Paso 4: Verificando que evento fue eliminado de Event...');

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/events?limit=100`,
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          const found = result.events.find(e => e.id === eventId);
          if (!found) {
            console.log('   ✅ Evento eliminado correctamente de tabla Event');
            resolve(true);
          } else {
            console.log('   ❌ Evento todavía existe en tabla Event');
            resolve(false);
          }
        } catch (error) {
          console.log('   ❌ Error parseando respuesta');
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log('   ❌ Error:', error.message);
      resolve(false);
    });

    req.end();
  });
}

// Ejecutar todos los pasos
async function runVerification() {
  try {
    // Paso 1: Verificar tabla
    const tableExists = await checkTableExists();
    if (!tableExists) {
      console.log('\n❌ Verificación fallida: Tabla no existe');
      console.log('💡 Ejecuta el endpoint de migración primero');
      return;
    }

    // Paso 2: Obtener evento de prueba
    const testEvent = await getTestEvent();
    if (!testEvent) {
      console.log('\n⚠️  No se puede continuar sin eventos para probar');
      return;
    }

    // Paso 3: Eliminar evento
    const deletedEvent = await deleteEvent(testEvent.id);
    if (!deletedEvent) {
      console.log('\n❌ Verificación fallida: No se pudo eliminar evento');
      return;
    }

    // Paso 4: Verificar eliminación
    const isDeleted = await verifyEventDeleted(testEvent.id);
    if (!isDeleted) {
      console.log('\n❌ Verificación fallida: Evento no fue eliminado');
      return;
    }

    // Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('✅ VERIFICACIÓN EXITOSA - US3.2 funcionando correctamente!');
    console.log('='.repeat(60));
    console.log('\n📝 Próximos pasos para verificación completa:');
    console.log('   1. Ejecuta: node scripts/scrape-livepass.js');
    console.log('   2. Verifica que el evento eliminado NO regresa');
    console.log(`   3. Busca "${deletedEvent.title}" en http://localhost:3000`);
    console.log('   4. El evento NO debe aparecer en los resultados\n');

    console.log('💾 Datos del evento eliminado (para referencia):');
    console.log(`   Source: ${deletedEvent.source}`);
    console.log(`   External ID: ${deletedEvent.externalId}`);
    console.log(`   Título: ${deletedEvent.title}\n`);

  } catch (error) {
    console.error('\n❌ Error durante verificación:', error.message);
    process.exit(1);
  }
}

// Ejecutar
runVerification();
