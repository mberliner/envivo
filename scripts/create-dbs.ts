/**
 * Script para crear archivos de BD SQLite vacíos
 * Prisma los inicializará automáticamente cuando se ejecute
 */

import { writeFileSync } from 'fs';
import { resolve } from 'path';

const dbs = [
  { name: 'dev.db', desc: 'Development' },
  { name: 'e2e.db', desc: 'E2E Testing' }
];

dbs.forEach(({ name, desc }) => {
  const path = resolve(process.cwd(), name);
  writeFileSync(path, '', { flag: 'wx' });
  console.log(`✅ Created ${desc} database: ${name}`);
});

console.log('\n🎉 Database files created successfully!');
console.log('Prisma will initialize the schema when the app starts.\n');
