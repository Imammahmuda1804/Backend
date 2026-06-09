import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  SentimentSummaryRow,
  TopicHeader,
  TopicReviewRow,
  TopicReviewSentiment,
} from './topic.types';

type SentimentSummaryBucket = 'positive' | 'neutral' | 'negative' | 'unknown';

const SENTIMENT_SUMMARY_BUCKETS: Record<string, SentimentSummaryBucket> = {
  positive: 'positive',
  positif: 'positive',
  neutral: 'neutral',
  netral: 'neutral',
  negative: 'negative',
  negatif: 'negative',
};

const SENTIMENT_FILTER_VALUES: Record<TopicReviewSentiment, string[]> = {
  positive: ['positive', 'positif'],
  neutral: ['neutral', 'netral'],
  negative: ['negative', 'negatif'],
};

@Injectable()
export class TopicReviewService {
  constructor(private readonly prisma: PrismaService) {}

  async findReviewsByTopic(
    topicId: number,
    page: number,
    limit: number,
    sentiment?: TopicReviewSentiment,
    destinationId?: number,
  ) {
    const topic = await this.findTopicHeader(topicId);
    const take = Math.min(Math.max(limit, 1), 50);
    const normalizedPage = Math.max(page, 1);
    const skip = (normalizedPage - 1) * take;
    const where = this.buildReviewFilter(topicId, sentiment, destinationId);

    const [reviews, total, sentimentRows] = await Promise.all([
      this.findReviews(where, skip, take),
      this.prisma.review.count({ where }),
      this.findSentimentSummary(topicId, destinationId),
    ]);

    return {
      topic: this.toTopicResponse(topic),
      sentiment_summary: this.normalizeSentimentSummary(sentimentRows),
      data: reviews.map((review) => this.toReviewResponse(review)),
      meta: {
        page: normalizedPage,
        limit: take,
        total,
        total_pages: Math.ceil(total / take),
      },
    };
  }

  private async findTopicHeader(topicId: number): Promise<TopicHeader> {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      select: {
        id: true,
        topicName: true,
        group: { select: { id: true, groupName: true } },
      },
    });

    if (!topic) throw new NotFoundException('Topic tidak ditemukan');
    return topic;
  }

  private buildReviewFilter(
    topicId: number,
    sentiment?: TopicReviewSentiment,
    destinationId?: number,
  ): Prisma.ReviewWhereInput {
    const sentimentValues = sentiment ? SENTIMENT_FILTER_VALUES[sentiment] : [];

    return {
      topicId,
      ...(destinationId ? { destinationId } : {}),
      ...(sentimentValues.length > 0
        ? { sentiment: { in: sentimentValues } }
        : {}),
      destination: { deletedAt: null },
    };
  }

  private findReviews(
    where: Prisma.ReviewWhereInput,
    skip: number,
    take: number,
  ): Promise<TopicReviewRow[]> {
    return this.prisma.review.findMany({
      where,
      skip,
      take,
      orderBy: [{ reviewDate: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        reviewerName: true,
        reviewText: true,
        rating: true,
        reviewDate: true,
        sentiment: true,
        sentimentConfidence: true,
        destination: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            province: true,
            thumbnailUrl: true,
          },
        },
      },
    });
  }

  private async findSentimentSummary(
    topicId: number,
    destinationId?: number,
  ): Promise<SentimentSummaryRow[]> {
    const rows = await this.prisma.review.groupBy({
      by: ['sentiment'],
      where: {
        topicId,
        ...(destinationId ? { destinationId } : {}),
        destination: { deletedAt: null },
      },
      _count: { _all: true },
    });

    return rows.map((row) => ({
      sentiment: row.sentiment,
      _count: { _all: row._count._all },
    }));
  }

  private normalizeSentimentSummary(rows: SentimentSummaryRow[]) {
    const summary = { positive: 0, neutral: 0, negative: 0, unknown: 0 };

    for (const row of rows) {
      const value = (row.sentiment ?? '').toLowerCase();
      const bucket = SENTIMENT_SUMMARY_BUCKETS[value] ?? 'unknown';
      summary[bucket] += row._count._all;
    }

    return summary;
  }

  private toTopicResponse(topic: TopicHeader) {
    return {
      id: topic.id,
      topic_name: topic.topicName,
      group: topic.group
        ? { id: topic.group.id, group_name: topic.group.groupName }
        : null,
    };
  }

  private toReviewResponse(review: TopicReviewRow) {
    return {
      id: review.id,
      reviewer_name: review.reviewerName,
      review_text: review.reviewText,
      rating: review.rating,
      review_date: review.reviewDate,
      sentiment: review.sentiment,
      sentiment_confidence: review.sentimentConfidence,
      destination: review.destination,
    };
  }
}
