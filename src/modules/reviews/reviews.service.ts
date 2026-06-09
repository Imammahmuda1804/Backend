import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateUserReviewDto } from './dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  // Membuat review user dan menghitung ulang rating.
  async createUserReview(userId: number, dto: CreateUserReviewDto) {
    const destination = await this.prisma.destination.findFirst({
      where: { id: dto.destination_id, deletedAt: null },
      select: { id: true },
    });

    if (!destination) {
      throw new NotFoundException('Destinasi tidak ditemukan');
    }
    const review = await this.prisma.userReview.create({
      data: {
        userId,
        destinationId: dto.destination_id,
        rating: dto.rating,
        reviewText: dto.review_text,
      },
      select: {
        id: true,
        destinationId: true,
        rating: true,
        reviewText: true,
        createdAt: true,
      },
    });
    this.recalculateUserRating(dto.destination_id).catch(() => {
      // Tidak gagalkan request jika recalculate gagal
    });

    return {
      id: review.id,
      destination_id: review.destinationId,
      rating: review.rating,
      review_text: review.reviewText,
      created_at: review.createdAt,
    };
  }

  // Menghapus scraped review dari admin.
  async deleteReview(reviewId: number) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, destinationId: true },
    });

    if (!review) {
      throw new NotFoundException('Review tidak ditemukan');
    }

    // Hard delete — ReviewEmbedding cascade otomatis via onDelete: Cascade
    await this.prisma.review.delete({ where: { id: reviewId } });

    return { message: 'Review deleted' };
  }

  // Menghapus user review dari admin.
  async deleteUserReview(userReviewId: number) {
    const userReview = await this.prisma.userReview.findUnique({
      where: { id: userReviewId },
      select: { id: true, destinationId: true },
    });

    if (!userReview) {
      throw new NotFoundException('User review tidak ditemukan');
    }

    await this.prisma.userReview.delete({ where: { id: userReviewId } });

    // Recalculate rating (non-blocking)
    this.recalculateUserRating(userReview.destinationId).catch(() => {});

    return { message: 'User review deleted' };
  }

  // Menghitung ulang rating user destinasi.
  async recalculateUserRating(destinationId: number): Promise<void> {
    const ratingSummary = await this.getUserReviewRatingSummary(destinationId);
    const recommendationScore = await this.calculateUserRecommendationScore(
      destinationId,
      ratingSummary.rating,
    );

    await this.prisma.destination.update({
      where: { id: destinationId },
      data: {
        userRating: ratingSummary.rating,
        userReviewCount: ratingSummary.count,
        ...(recommendationScore !== undefined && { recommendationScore }),
      },
    });
  }

  private async getUserReviewRatingSummary(destinationId: number) {
    const aggregate = await this.prisma.userReview.aggregate({
      where: { destinationId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      rating: aggregate._avg.rating ?? null,
      count: aggregate._count.rating,
    };
  }

  private async calculateUserRecommendationScore(
    destinationId: number,
    userRating: number | null,
  ) {
    if (userRating === null) return undefined;

    const sentimentReviews = await this.findReviewsWithSentiment(destinationId);
    if (sentimentReviews.length === 0) return undefined;

    const positiveRatio =
      this.countPositiveReviews(sentimentReviews) / sentimentReviews.length;
    return (userRating / 5) * 0.5 + positiveRatio * 0.5;
  }

  private findReviewsWithSentiment(destinationId: number) {
    return this.prisma.review.findMany({
      where: { destinationId, sentiment: { not: null } },
      select: { sentiment: true },
    });
  }

  private countPositiveReviews(reviews: Array<{ sentiment: string | null }>) {
    return reviews.filter((review) => review.sentiment === 'positive').length;
  }

  // Mengambil review destinasi untuk admin.
  async getReviewsByDestination(
    destinationId: number,
    page: number,
    limit: number,
    sentiment?: string,
    topicId?: number,
    dateFrom?: string,
    dateTo?: string,
    sortBy?: 'newest' | 'oldest',
    nlpStatus?: 'all' | 'processed' | 'unprocessed',
  ) {
    const skip = (page - 1) * limit;
    const where = this.buildDestinationReviewFilter({
      destinationId,
      sentiment,
      topicId,
      dateFrom,
      dateTo,
      nlpStatus,
    });
    const orderBy = this.getReviewOrder(sortBy);

    const [total, reviews] = await Promise.all([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          topic: { select: { id: true, topicName: true } },
        },
      }),
    ]);

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private buildDestinationReviewFilter(input: {
    destinationId: number;
    sentiment?: string;
    topicId?: number;
    dateFrom?: string;
    dateTo?: string;
    nlpStatus?: 'all' | 'processed' | 'unprocessed';
  }): Prisma.ReviewWhereInput {
    return {
      destinationId: input.destinationId,
      ...(input.sentiment && { sentiment: input.sentiment }),
      ...(input.topicId && { topicId: input.topicId }),
      ...this.buildReviewDateFilter(input.dateFrom, input.dateTo),
      ...this.buildReviewNlpFilter(input.nlpStatus),
    };
  }

  private buildReviewDateFilter(
    dateFrom?: string,
    dateTo?: string,
  ): Prisma.ReviewWhereInput {
    if (!dateFrom && !dateTo) return {};

    return {
      reviewDate: this.buildReviewDateRange(dateFrom, dateTo),
    };
  }

  private buildReviewDateRange(dateFrom?: string, dateTo?: string) {
    const range: Prisma.DateTimeNullableFilter = {};
    if (dateFrom) range.gte = new Date(dateFrom);
    if (dateTo) range.lte = this.endOfDay(dateTo);
    return range;
  }

  private endOfDay(date: string) {
    return new Date(new Date(date).setHours(23, 59, 59, 999));
  }

  private buildReviewNlpFilter(
    nlpStatus?: 'all' | 'processed' | 'unprocessed',
  ): Prisma.ReviewWhereInput {
    if (nlpStatus === 'processed') return { cleanedText: { not: null } };
    if (nlpStatus === 'unprocessed') return { cleanedText: null };
    return {};
  }

  private getReviewOrder(
    sortBy?: 'newest' | 'oldest',
  ): Prisma.ReviewOrderByWithRelationInput {
    return sortBy === 'oldest' ? { reviewDate: 'asc' } : { reviewDate: 'desc' };
  }

  // Menghapus banyak review sekaligus.
  async deleteBulkReviews(
    destinationId: number,
    category: 'all' | 'processed' | 'unprocessed',
  ) {
    const whereClause: Prisma.ReviewWhereInput = { destinationId };

    if (category === 'processed') {
      whereClause.cleanedText = { not: null };
    } else if (category === 'unprocessed') {
      whereClause.cleanedText = null;
    }

    const result = await this.prisma.review.deleteMany({
      where: whereClause,
    });

    return { message: `${result.count} review berhasil dihapus` };
  }
}
