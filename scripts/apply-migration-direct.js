/**
 * Apply EventBlacklist migration directly via Prisma
 * This bypasses the need for HTTP server
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Checking if event_blacklist table exists...\n');

  // Check if table exists
  const tables = await prisma.$queryRaw`
    SELECT name FROM sqlite_master WHERE type='table' AND name='event_blacklist'
  `;

  if (tables.length > 0) {
    console.log('⚠️  Table "event_blacklist" already exists');
    console.log('Migration already applied!\n');
    return;
  }

  console.log('📝 Creating event_blacklist table...');

  // Create table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE "event_blacklist" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "source" TEXT NOT NULL,
      "externalId" TEXT NOT NULL,
      "reason" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Table created');

  // Create unique index
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX "event_blacklist_source_externalId_key"
    ON "event_blacklist"("source", "externalId")
  `);
  console.log('✅ Unique index created');

  // Create search index
  await prisma.$executeRawUnsafe(`
    CREATE INDEX "event_blacklist_source_externalId_idx"
    ON "event_blacklist"("source", "externalId")
  `);
  console.log('✅ Search index created\n');

  console.log('🎉 Migration completed successfully!\n');
  console.log('⚠️  IMPORTANT: Restart your dev server (npm run dev) to use the new table');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error:', e.message);
    await prisma.$disconnect();
    process.exit(1);
  });
