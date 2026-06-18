import { Injectable, NotFoundException } from '@nestjs/common';
import {
  SentimentTrendCounts,
  upsertSentimentTrend,
} from '../../common/utils/sentiment-trend.util';
import { PrismaService } from '../../prisma/prisma.service';
import { ReviewTopicQueryService } from '../topic-mapping/review-topic-query.service';
import { normalizeAnalyticsSentiment } from './analytics.utils';

@Injectable()
export class AnalyticsRecalculationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reviewTopics: ReviewTopicQueryService,
  ) {}

  async recalculate(destinationId: number) {
    const destination = await this.prisma.destination.findFirst({
      where: { id: destinationId, deletedAt: null },
      select: { id: true, googleRating: true },
    });

    if (!destination) {
      throw new NotFoundException('Destinasi tidak ditemukan');
    }

    const score = await this.refreshRecommendationScore(
      destinationId,
      destination.googleRating,
    );
    const topicsCount = await this.refreshTopicCounts(destinationId);
    await this.refreshSentimentTrends(destinationId);
    const totalReviews = await this.prisma.review.count({
      where: { destinationId },
    });

    return {
      message: 'Analytics recalculated',
      destination_id: destinationId,
      positive_ratio: this.roundMetric(score.positiveRatio),
      recommendation_score: this.roundMetric(score.recommendationScore),
      total_reviews: totalReviews,
      topics_count: topicsCount,
    };
  }

  private async refreshRecommendationScore(
    destinationId: number,
    googleRating: number | null,
  ) {
    const [reviews, userRatings] = await Promise.all([
      this.prisma.review.findMany({
        where: { destinationId, sentiment: { not: null } },
        select: { sentiment: true },
      }),
      this.prisma.userReview.aggregate({
        where: { destinationId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    const positiveRatio = this.calculatePositiveRatio(reviews);
    const userRating = userRatings._avg.rating ?? googleRating ?? 0;
    const recommendationScore = (userRating / 5) * 0.5 + positiveRatio * 0.5;

    await this.prisma.destination.update({
      where: { id: destinationId },
      data: {
        positiveRatio,
        recommendationScore,
        userRating: userRatings._avg.rating ?? null,
        userReviewCount: userRatings._count.rating,
      },
    });

    return { positiveRatio, recommendationScore };
  }

  private calculatePositiveRatio(reviews: Array<{ sentiment: string | null }>) {
    if (reviews.length === 0) return 0;

    const positiveCount = reviews.filter(
      (review) => normalizeAnalyticsSentiment(review.sentiment) === 'positive',
    ).length;
    return positiveCount / reviews.length;
  }

  private async refreshTopicCounts(destinationId: number) {
    const topicCounts = await this.reviewTopics.getTopicCounts(destinationId);

    await this.prisma.destinationTopic.deleteMany({
      where: { destinationId },
    });

    for (const { topicId, totalReviews } of topicCounts) {
      await this.prisma.destinationTopic.upsert({
        where: { destinationId_topicId: { destinationId, topicId } },
        create: { destinationId, topicId, totalReviews },
        update: { totalReviews },
      });
    }

    return topicCounts.length;
  }

  private async refreshSentimentTrends(destinationId: number) {
    const reviews = await this.prisma.review.findMany({
      where: { destinationId, reviewDate: { not: null } },
      select: { reviewDate: true, sentiment: true },
    });
    const trends = this.buildMonthlyTrendMap(reviews);

    for (const [date, counts] of trends) {
      await upsertSentimentTrend(
        this.prisma,
        destinationId,
        new Date(date),
        counts,
      );
    }
  }

  private buildMonthlyTrendMap(
    reviews: Array<{ reviewDate: Date | null; sentiment: string | null }>,
  ) {
    const trends = new Map<string, SentimentTrendCounts>();

    for (const review of reviews) {
      const month = this.toMonthStart(review.reviewDate);
      if (!month) continue;

      const counts = trends.get(month) ?? { pos: 0, neg: 0, neu: 0 };
      counts[this.toTrendCountKey(review.sentiment)] += 1;
      trends.set(month, counts);
    }

    return trends;
  }

  private toMonthStart(date: Date | null) {
    if (!date) return null;
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
  }

  private toTrendCountKey(
    sentiment: string | null,
  ): keyof SentimentTrendCounts {
    const countKeys: Record<string, keyof SentimentTrendCounts> = {
      positive: 'pos',
      negative: 'neg',
      neutral: 'neu',
    };
    return countKeys[normalizeAnalyticsSentiment(sentiment)];
  }

  private roundMetric(value: number) {
    return Math.round(value * 1000) / 1000;
  }
}
