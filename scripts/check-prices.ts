import { prisma } from '../src/shared/infrastructure/database/prisma';

async function main() {
  const events = await prisma.event.findMany({
    where: { source: 'livepass' },
    take: 5,
    select: {
      title: true,
      price: true,
      priceMax: true,
      ticketUrl: true,
    },
  });

  console.log('LivePass events pricing:');
  console.log(JSON.stringify(events, null, 2));
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
