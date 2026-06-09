import { PrismaService } from '../../prisma/prisma.service';

export type SentimentTrendCounts = {
  pos: number;
  neg: number;
  neu: number;
};

export const upsertSentimentTrend = (
  prisma: PrismaService,
  destinationId: number,
  date: Date,
  counts: SentimentTrendCounts,
) =>
  prisma.sentimentTrend.upsert({
    where: { destinationId_date: { destinationId, date } },
    create: {
      destinationId,
      date,
      positiveCount: counts.pos,
      negativeCount: counts.neg,
      neutralCount: counts.neu,
    },
    update: {
      positiveCount: counts.pos,
      negativeCount: counts.neg,
      neutralCount: counts.neu,
    },
  });
