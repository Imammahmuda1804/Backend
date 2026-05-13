const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const destinations = await prisma.destination.findMany({
    where: {
      thumbnailUrl: {
        contains: 'google.com/imgres',
      },
    },
  });

  for (const dest of destinations) {
    console.log(`Fixing ${dest.name}...`);
    await prisma.destination.update({
      where: { id: dest.id },
      data: {
        thumbnailUrl: 'https://pict.sindonews.com/dyn/850/pena/news/2020/12/31/29/286616/sejarah-jam-gadang-di-bukittinggi-dan-berkibarnya-bendera--merah-putih-trf.jpg',
      },
    });
  }
  console.log('Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
