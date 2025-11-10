import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Applying EventBlacklist migration...');

  const migrationSQL = fs.readFileSync(
    path.join(__dirname, '../prisma/migrations/20251110_add_event_blacklist/migration.sql'),
    'utf-8'
  );

  // Split by semicolon and execute each statement
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    console.log(`Executing: ${statement.substring(0, 60)}...`);
    await prisma.$executeRawUnsafe(statement);
  }

  console.log('✅ Migration applied successfully!');

  // Verify table was created
  const result = await prisma.$queryRaw<Array<{ name: string }>>`
    SELECT name FROM sqlite_master WHERE type='table' AND name='event_blacklist'
  `;

  if (result.length > 0) {
    console.log('✅ Table "event_blacklist" exists!');
  } else {
    console.error('❌ Table was not created');
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
