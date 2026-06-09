import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsPeriod } from './analytics.types';
import {
  buildSentimentDistribution,
  getAnalyticsPeriodKey,
  toSortedTrendRows,
} from './analytics.utils';

@Injectable()
export class DestinationAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(destinationId: number) {
    const destination = await this.prisma.destination.findFirst({
      where: { id: destinationId, deletedAt: null },
      select: {
        id: true,
        name: true,
        googleRating: true,
        positiveRatio: true,
        recommendationScore: true,
      },
    });

    if (!destination) this.throwDestinationNotFound();

    const [sentimentCounts, totalReviews, averageRating] = await Promise.all([
      this.prisma.review.groupBy({
        by: ['sentiment'],
        _count: { sentiment: true },
        where: { destinationId, sentiment: { not: null } },
      }),
      this.prisma.review.count({ where: { destinationId } }),
      this.prisma.review.aggregate({
        where: { destinationId, rating: { not: null } },
        _avg: { rating: true },
      }),
    ]);

    return {
      destination_id: destination.id,
      destination_name: destination.name,
      total_reviews: totalReviews,
      sentiment_distribution: buildSentimentDistribution(sentimentCounts),
      average_rating:
        averageRating._avg.rating ?? destination.googleRating ?? null,
      positive_ratio: destination.positiveRatio,
      recommendation_score: destination.recommendationScore,
    };
  }

  async getTopics(destinationId: number) {
    await this.assertDestinationExists(destinationId);

    const destinationTopics = await this.prisma.destinationTopic.findMany({
      where: { destinationId },
      include: { topic: { select: { topicName: true } } },
      orderBy: { totalReviews: 'desc' },
    });
    const totalReviews = destinationTopics.reduce(
      (sum, topic) => sum + topic.totalReviews,
      0,
    );

    return {
      topics: destinationTopics.map((topic) => ({
        topic_name: topic.topic.topicName,
        total_reviews: topic.totalReviews,
        percentage:
          totalReviews > 0
            ? Math.round((topic.totalReviews / totalReviews) * 100)
            : 0,
      })),
    };
  }

  async getTrends(destinationId: number, period: AnalyticsPeriod = 'monthly') {
    await this.assertDestinationExists(destinationId);

    const rawTrends = await this.prisma.sentimentTrend.findMany({
      where: { destinationId },
      orderBy: { date: 'asc' },
      select: {
        date: true,
        positiveCount: true,
        negativeCount: true,
        neutralCount: true,
      },
    });
    const grouped = new Map<
      string,
      { positive: number; negative: number; neutral: number }
    >();

    for (const trend of rawTrends) {
      const key = getAnalyticsPeriodKey(trend.date, period);
      const current = grouped.get(key) ?? {
        positive: 0,
        negative: 0,
        neutral: 0,
      };
      grouped.set(key, {
        positive: current.positive + trend.positiveCount,
        negative: current.negative + trend.negativeCount,
        neutral: current.neutral + trend.neutralCount,
      });
    }

    return { trends: toSortedTrendRows(grouped) };
  }

  private async assertDestinationExists(destinationId: number) {
    const destination = await this.prisma.destination.findFirst({
      where: { id: destinationId, deletedAt: null },
      select: { id: true },
    });

    if (!destination) this.throwDestinationNotFound();
  }

  private throwDestinationNotFound(): never {
    throw new NotFoundException('Destinasi tidak ditemukan');
  }
}
