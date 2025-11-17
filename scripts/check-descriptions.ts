/**
 * Script para verificar si las descripciones se están guardando en BD
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDescriptions() {
  console.log('🔍 Checking descriptions in database for Movistar Arena events...\n');

  const events = await prisma.event.findMany({
    where: {
      source: 'movistararena',
    },
    select: {
      id: true,
      title: true,
      description: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });

  console.log(`Found ${events.length} events from Movistar Arena\n`);

  events.forEach((event, i) => {
    console.log(`[${i + 1}] ${event.title}`);
    console.log(`    ID: ${event.id}`);
    console.log(`    Created: ${event.createdAt}`);
    console.log(`    Description: ${event.description ? `${event.description.length} chars` : 'NULL'}`);
    if (event.description) {
      console.log(`    Preview: "${event.description.substring(0, 100)}..."`);
    }
    console.log('');
  });

  await prisma.$disconnect();
}

checkDescriptions().catch(console.error);
