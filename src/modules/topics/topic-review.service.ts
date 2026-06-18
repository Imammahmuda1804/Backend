import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ReviewTopicAssignment,
  ReviewTopicQueryService,
} from '../topic-mapping/review-topic-query.service';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly reviewTopics: ReviewTopicQueryService,
  ) {}

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
    const sentimentValues = sentiment ? SENTIMENT_FILTER_VALUES[sentiment] : [];
    const [pageResult, sentimentRows] = await Promise.all([
      this.reviewTopics.findReviewPage({
        topicIds: [topicId],
        destinationId,
        sentiments: sentimentValues,
        skip,
        take,
      }),
      this.reviewTopics.getSentimentSummary([topicId], destinationId),
    ]);
    const reviews = await this.findReviews(pageResult.reviewIds);
    const assignmentsByReviewId: Map<number, ReviewTopicAssignment[]> =
      pageResult.assignmentsByReviewId;
    const reviewsWithAssignments = reviews.map((review) => ({
      ...review,
      topicAssignments: assignmentsByReviewId.get(review.id) ?? [],
    }));

    return {
      topic: this.toTopicResponse(topic),
      sentiment_summary: this.normalizeSentimentSummary(sentimentRows),
      data: reviewsWithAssignments.map((review) =>
        this.toReviewResponse(review),
      ),
      meta: {
        page: normalizedPage,
        limit: take,
        total: pageResult.total,
        total_pages: Math.ceil(pageResult.total / take),
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

  private async findReviews(reviewIds: number[]): Promise<TopicReviewRow[]> {
    if (reviewIds.length === 0) return [];

    const reviews = await this.prisma.review.findMany({
      where: { id: { in: reviewIds } },
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

    const order = new Map(reviewIds.map((id, index) => [id, index]));
    return reviews.sort(
      (left, right) =>
        (order.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
        (order.get(right.id) ?? Number.MAX_SAFE_INTEGER),
    );
  }

  private normalizeSentimentRows(
    rows: Array<{ sentiment: string | null; count: number }>,
  ): SentimentSummaryRow[] {
    return rows.map((row) => ({
      sentiment: row.sentiment,
      _count: { _all: row.count },
    }));
  }

  private normalizeSentimentSummary(
    rawRows: Array<{ sentiment: string | null; count: number }>,
  ) {
    const rows = this.normalizeSentimentRows(rawRows);
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
      topic_assignments: review.topicAssignments ?? [],
      destination: review.destination,
    };
  }
}
