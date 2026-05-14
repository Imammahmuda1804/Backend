const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const reviews = await prisma.review.findMany({
    orderBy: { id: 'desc' },
    take: 5,
    select: {
      id: true,
      reviewText: true,
      cleanedText: true,
      reviewDate: true,
      reviewerName: true,
      rating: true,
      sentiment: true,
    },
  });

  for (const r of reviews) {
    console.log('---');
    console.log('ID:', r.id);
    console.log('reviewText:', (r.reviewText || '').substring(0, 150));
    console.log('cleanedText:', (r.cleanedText || '').substring(0, 150));
    console.log('reviewDate:', r.reviewDate);
    console.log('reviewerName:', r.reviewerName);
    console.log('rating:', r.rating);
    console.log('sentiment:', r.sentiment);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
