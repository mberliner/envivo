/**
 * Check global preferences
 */

import { prisma } from '../src/shared/infrastructure/database/prisma';

async function checkPreferences() {
  const prefs = await prisma.globalPreferences.findUnique({
    where: { id: 'singleton' },
  });

  console.log('Global Preferences:');
  console.log(JSON.stringify(prefs, null, 2));

  await prisma.$disconnect();
}

checkPreferences();
