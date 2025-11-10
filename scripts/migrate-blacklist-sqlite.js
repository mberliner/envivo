const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../prisma/dev.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Applying EventBlacklist migration to SQLite...\n');

// Verificar si la tabla ya existe
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='event_blacklist'", (err, row) => {
  if (err) {
    console.error('❌ Error checking table:', err);
    process.exit(1);
  }

  if (row) {
    console.log('⚠️  Table "event_blacklist" already exists, skipping');
    db.close();
    return;
  }

  // Crear tabla
  db.serialize(() => {
    db.run(`
      CREATE TABLE "event_blacklist" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "source" TEXT NOT NULL,
        "externalId" TEXT NOT NULL,
        "reason" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('❌ Error creating table:', err);
        process.exit(1);
      }
      console.log('✅ Table "event_blacklist" created');
    });

    db.run(`
      CREATE UNIQUE INDEX "event_blacklist_source_externalId_key"
      ON "event_blacklist"("source", "externalId")
    `, (err) => {
      if (err) {
        console.error('❌ Error creating unique index:', err);
        process.exit(1);
      }
      console.log('✅ Unique index created');
    });

    db.run(`
      CREATE INDEX "event_blacklist_source_externalId_idx"
      ON "event_blacklist"("source", "externalId")
    `, (err) => {
      if (err) {
        console.error('❌ Error creating search index:', err);
        process.exit(1);
      }
      console.log('✅ Search index created');

      db.close(() => {
        console.log('\n✅ Migration completed successfully!');
        console.log('\nNext step: Run "npx prisma generate" to regenerate client');
      });
    });
  });
});
