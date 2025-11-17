/**
 * Script para eliminar eventos de Movistar Arena de la BD
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteMovistarEvents() {
  console.log('🗑️  Deleting Movistar Arena events from database...\n');

  const result = await prisma.event.deleteMany({
    where: {
      source: 'movistararena',
    },
  });

  console.log(`✅ Deleted ${result.count} events from Movistar Arena\n`);

  await prisma.$disconnect();
}

deleteMovistarEvents().catch(console.error);
