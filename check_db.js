const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const latestDestinations = await prisma.destination.findMany({
      orderBy: { id: 'desc' },
      take: 3,
      include: {
        images: true,
      }
    });
    
    console.log(JSON.stringify(latestDestinations, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

check();
