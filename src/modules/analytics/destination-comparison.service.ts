import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CompareDestinationSnapshot } from './analytics.types';
import { buildSentimentDistribution } from './analytics.utils';
import { DestinationComparisonInsightsService } from './destination-comparison-insights.service';

@Injectable()
export class DestinationComparisonService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly insights: DestinationComparisonInsightsService,
  ) {}

  async compare(id1: number, id2: number) {
    const snapshots = await Promise.all([
      this.getDestinationSnapshot(id1),
      this.getDestinationSnapshot(id2),
    ]);
    const [destination1, destination2] = this.requireSnapshots(
      id1,
      id2,
      snapshots,
    );

    return {
      destination1,
      destination2,
      comparison: this.insights.buildComparison(destination1, destination2),
    };
  }

  private requireSnapshots(
    id1: number,
    id2: number,
    snapshots: Array<CompareDestinationSnapshot | null>,
  ): [CompareDestinationSnapshot, CompareDestinationSnapshot] {
    const [destination1, destination2] = snapshots;

    if (!destination1) {
      throw new BadRequestException(
        `Destinasi dengan id ${id1} tidak ditemukan`,
      );
    }
    if (!destination2) {
      throw new BadRequestException(
        `Destinasi dengan id ${id2} tidak ditemukan`,
      );
    }

    return [destination1, destination2];
  }

  private async getDestinationSnapshot(
    id: number,
  ): Promise<CompareDestinationSnapshot | null> {
    const destination = await this.prisma.destination.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        province: true,
        category: true,
        thumbnailUrl: true,
        latitude: true,
        longitude: true,
        googleMapsUrl: true,
        googleRating: true,
        userRating: true,
        positiveRatio: true,
        recommendationScore: true,
        destinationTopics: {
          include: {
            topic: {
              select: {
                topicName: true,
                group: { select: { groupName: true } },
              },
            },
          },
          orderBy: { totalReviews: 'desc' },
          take: 10,
        },
      },
    });

    if (!destination) return null;

    const [sentimentCounts, reviewCount] = await Promise.all([
      this.prisma.review.groupBy({
        by: ['sentiment'],
        _count: { sentiment: true },
        where: { destinationId: id, sentiment: { not: null } },
      }),
      this.prisma.review.count({ where: { destinationId: id } }),
    ]);

    const topics = destination.destinationTopics.map((item) => ({
      topic_name: item.topic.topicName,
      total_reviews: item.totalReviews,
      group_name: item.topic.group?.groupName ?? null,
    }));
    const sentiment = buildSentimentDistribution(sentimentCounts);
    const insight = this.insights.buildSnapshotInsights(
      destination,
      topics,
      sentiment,
    );

    return {
      id: destination.id,
      name: destination.name,
      slug: destination.slug,
      city: destination.city,
      province: destination.province,
      category: destination.category,
      thumbnailUrl: destination.thumbnailUrl,
      latitude: destination.latitude,
      longitude: destination.longitude,
      googleMapsUrl: destination.googleMapsUrl,
      sentiment,
      topics: topics.slice(0, 5),
      top_topics: topics.slice(0, 5),
      topic_groups: insight.topic_groups,
      rating: {
        google: destination.googleRating,
        user: destination.userRating,
      },
      recommendation_score: destination.recommendationScore,
      positive_ratio: destination.positiveRatio,
      review_count: reviewCount,
      travel_traits: insight.travel_traits,
      decision_factors: insight.decision_factors,
      highlights: insight.highlights,
      risks: insight.risks,
    };
  }
}
