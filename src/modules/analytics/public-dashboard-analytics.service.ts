import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { buildSentimentDistribution } from './analytics.utils';

@Injectable()
export class PublicDashboardAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const [
      totalDestinations,
      totalReviews,
      sentimentCounts,
      topTopics,
      topRecommendations,
    ] = await Promise.all([
      this.prisma.destination.count({ where: { deletedAt: null } }),
      this.prisma.review.count(),
      this.prisma.review.groupBy({
        by: ['sentiment'],
        _count: { sentiment: true },
        where: { sentiment: { not: null } },
      }),
      this.prisma.destinationTopic.groupBy({
        by: ['topicId'],
        _sum: { totalReviews: true },
        orderBy: { _sum: { totalReviews: 'desc' } },
        take: 5,
      }),
      this.prisma.destination.findMany({
        where: { deletedAt: null, recommendationScore: { not: null } },
        orderBy: { recommendationScore: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          slug: true,
          city: true,
          thumbnailUrl: true,
          recommendationScore: true,
          positiveRatio: true,
        },
      }),
    ]);
    const topicNames = await this.fetchTopicNames(
      topTopics.map((topic) => topic.topicId),
    );

    return {
      total_destinations: totalDestinations,
      total_reviews: totalReviews,
      sentiment_distribution: buildSentimentDistribution(sentimentCounts),
      top_topics: topTopics.map((topic) => ({
        topic_name: topicNames.get(topic.topicId) ?? 'Unknown',
        count: topic._sum.totalReviews ?? 0,
      })),
      top_recommendations: topRecommendations,
    };
  }

  private async fetchTopicNames(topicIds: number[]) {
    const topics = await this.prisma.topic.findMany({
      where: { id: { in: topicIds } },
      select: { id: true, topicName: true },
    });

    return new Map(topics.map((topic) => [topic.id, topic.topicName]));
  }
}
