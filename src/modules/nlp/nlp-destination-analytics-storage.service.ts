import { Injectable } from '@nestjs/common';
import { upsertSentimentTrend } from '../../common/utils/sentiment-trend.util';
import { PrismaService } from '../../prisma/prisma.service';
import { ReviewTopicQueryService } from '../topic-mapping/review-topic-query.service';

type ReviewSentimentSummary = Array<{ sentiment: string | null }>;

type DestinationRatingSummary = {
  userRating: number | null;
  googleRating: number | null;
} | null;

@Injectable()
export class NlpDestinationAnalyticsStorageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reviewTopics: ReviewTopicQueryService,
  ) {}

  async refresh(destinationId: number) {
    await this.calculateRecommendationScore(destinationId);
    await this.updateDestinationTopics(destinationId);
    await this.updateSentimentTrends(destinationId);
  }
  // Menghitung skor rekomendasi dari rating dan rasio sentimen positif.
  private async calculateRecommendationScore(destinationId: number) {
    const reviews = await this.findReviewsWithSentiment(destinationId);
    const positiveRatio = this.calculatePositiveRatio(reviews);
    if (positiveRatio === null) return;

    const rating = await this.findDestinationRating(destinationId);
    const recommendationScore = this.calculateDestinationRecommendationScore(
      rating,
      positiveRatio,
    );

    await this.prisma.destination.update({
      where: { id: destinationId },
      data: {
        positiveRatio,
        recommendationScore,
      },
    });
  }

  private findReviewsWithSentiment(
    destinationId: number,
  ): Promise<ReviewSentimentSummary> {
    return this.prisma.review.findMany({
      where: { destinationId, sentiment: { not: null } },
      select: { sentiment: true },
    });
  }

  private calculatePositiveRatio(reviews: ReviewSentimentSummary) {
    if (reviews.length === 0) return null;
    return this.countPositiveReviews(reviews) / reviews.length;
  }

  private countPositiveReviews(reviews: ReviewSentimentSummary) {
    return reviews.filter((review) => review.sentiment === 'positive').length;
  }

  private async findDestinationRating(destinationId: number) {
    const destination = await this.prisma.destination.findUnique({
      where: { id: destinationId },
      select: { userRating: true, googleRating: true },
    });

    return this.resolveDestinationRating(destination);
  }

  private resolveDestinationRating(destination: DestinationRatingSummary) {
    if (!destination) return 0;
    if (destination.userRating !== null) return destination.userRating;
    if (destination.googleRating !== null) return destination.googleRating;
    return 0;
  }

  private calculateDestinationRecommendationScore(
    rating: number,
    positiveRatio: number,
  ) {
    return (rating / 5) * 0.5 + positiveRatio * 0.5;
  }

  // Menghitung jumlah review per topik untuk satu destinasi.
  private async updateDestinationTopics(destinationId: number) {
    await this.prisma.destinationTopic.deleteMany({
      where: { destinationId },
    });

    const topicCounts = await this.reviewTopics.getTopicCounts(destinationId);

    for (const { topicId, totalReviews } of topicCounts) {
      await this.prisma.destinationTopic.upsert({
        where: {
          destinationId_topicId: {
            destinationId,
            topicId,
          },
        },
        create: {
          destinationId,
          topicId,
          totalReviews,
        },
        update: {
          totalReviews,
        },
      });
    }
  }

  // Menghitung tren sentimen bulanan dari tanggal review.
  private async updateSentimentTrends(destinationId: number) {
    await this.prisma.sentimentTrend.deleteMany({
      where: { destinationId },
    });

    const reviews = await this.prisma.review.findMany({
      where: { destinationId, reviewDate: { not: null } },
      select: { reviewDate: true, sentiment: true },
    });

    const trends = this.groupMonthlySentimentTrends(reviews);

    for (const [dateStr, counts] of Object.entries(trends)) {
      const date = new Date(dateStr);
      await upsertSentimentTrend(this.prisma, destinationId, date, counts);
    }
  }

  private groupMonthlySentimentTrends(
    reviews: Array<{ reviewDate: Date | null; sentiment: string | null }>,
  ) {
    const trends: Record<string, { pos: number; neg: number; neu: number }> =
      {};

    for (const review of reviews) {
      const dateStr = this.toSentimentTrendMonth(review.reviewDate);
      if (!dateStr) continue;

      trends[dateStr] ??= { pos: 0, neg: 0, neu: 0 };
      this.incrementTrendCount(trends[dateStr], review.sentiment);
    }

    return trends;
  }

  private toSentimentTrendMonth(reviewDate: Date | null) {
    if (!reviewDate) return null;

    return new Date(
      reviewDate.getFullYear(),
      reviewDate.getMonth(),
      1,
    ).toISOString();
  }

  private incrementTrendCount(
    counts: { pos: number; neg: number; neu: number },
    sentiment: string | null,
  ) {
    counts[this.toTrendCountKey(sentiment)]++;
  }

  private toTrendCountKey(sentiment: string | null): 'pos' | 'neg' | 'neu' {
    if (sentiment === 'positive') return 'pos';
    if (sentiment === 'negative') return 'neg';
    return 'neu';
  }
}
