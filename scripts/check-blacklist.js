#!/usr/bin/env node
/**
 * Script para verificar contenido de EventBlacklist
 *
 * Muestra todos los eventos que están en la blacklist
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../prisma/dev.db');

console.log('🔍 Verificando EventBlacklist...\n');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error conectando a la base de datos:', err.message);
    process.exit(1);
  }
});

// Verificar si la tabla existe
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='event_blacklist'", (err, row) => {
  if (err) {
    console.error('❌ Error:', err.message);
    db.close();
    process.exit(1);
  }

  if (!row) {
    console.log('❌ Tabla "event_blacklist" NO existe');
    console.log('💡 Ejecuta primero: node scripts/verify-us3.2.js');
    db.close();
    return;
  }

  console.log('✅ Tabla "event_blacklist" existe\n');

  // Contar eventos en blacklist
  db.get('SELECT COUNT(*) as count FROM event_blacklist', (err, row) => {
    if (err) {
      console.error('❌ Error contando eventos:', err.message);
      db.close();
      return;
    }

    console.log(`📊 Total de eventos blacklisted: ${row.count}\n`);

    if (row.count === 0) {
      console.log('⚠️  No hay eventos en la blacklist todavía');
      console.log('💡 Ejecuta: node scripts/verify-us3.2.js para agregar uno\n');
      db.close();
      return;
    }

    // Mostrar todos los eventos blacklisted
    db.all('SELECT * FROM event_blacklist ORDER BY createdAt DESC', (err, rows) => {
      if (err) {
        console.error('❌ Error:', err.message);
        db.close();
        return;
      }

      console.log('📋 Eventos en Blacklist:');
      console.log('─'.repeat(80));

      rows.forEach((row, index) => {
        console.log(`\n${index + 1}. ${row.source}/${row.externalId}`);
        console.log(`   ID: ${row.id}`);
        console.log(`   Razón: ${row.reason || 'No especificada'}`);
        console.log(`   Fecha: ${new Date(row.createdAt).toLocaleString('es-AR')}`);
      });

      console.log('\n' + '─'.repeat(80));
      console.log(`\n✅ Total: ${rows.length} evento(s) en blacklist\n`);

      db.close();
    });
  });
});
