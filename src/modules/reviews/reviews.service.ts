import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserReviewDto } from './dto';

@Injectable()
export class ReviewsService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * POST /user-reviews
     * Buat review baru, lalu recalculate user_rating & user_review_count destinasi.
     */
    async createUserReview(userId: number, dto: CreateUserReviewDto) {
        // 1. Validate destination exists
        const destination = await this.prisma.destination.findFirst({
            where: { id: dto.destination_id, deletedAt: null },
            select: { id: true },
        });

        if (!destination) {
            throw new NotFoundException('Destinasi tidak ditemukan');
        }

        // 2. Create review
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

        // 3. Recalculate destination user_rating & user_review_count (non-blocking)
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

    /**
     * DELETE /admin/reviews/:id — hapus scraped review (admin moderation)
     * ReviewEmbedding dihapus via cascade di DB.
     */
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

    /**
     * DELETE /admin/user-reviews/:id — hapus user review (admin moderation)
     * Lalu recalculate user_rating destinasi.
     */
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
        this.recalculateUserRating(userReview.destinationId).catch(() => { });

        return { message: 'User review deleted' };
    }

    /**
     * Recalculate AVG rating dan count dari semua user reviews per destination.
     * Juga update recommendationScore karena formula-nya menggunakan userRating.
     */
    async recalculateUserRating(destinationId: number): Promise<void> {
        const agg = await this.prisma.userReview.aggregate({
            where: { destinationId },
            _avg: { rating: true },
            _count: { rating: true },
        });

        const newUserRating = agg._avg.rating ?? null;
        const newUserReviewCount = agg._count.rating;

        // Hitung ulang recommendationScore (formula: rating*0.5 + positiveRatio*0.5)
        // konsisten dengan NlpResultStorageService.calculateRecommendationScore
        const sentimentReviews = await this.prisma.review.findMany({
            where: { destinationId, sentiment: { not: null } },
            select: { sentiment: true },
        });

        let recommendationScore: number | undefined;
        if (sentimentReviews.length > 0 && newUserRating !== null) {
            const positiveCount = sentimentReviews.filter(
                (r) => r.sentiment === 'positive',
            ).length;
            const positiveRatio = positiveCount / sentimentReviews.length;
            const normalizedRating = newUserRating / 5;
            recommendationScore = normalizedRating * 0.5 + positiveRatio * 0.5;
        }

        await this.prisma.destination.update({
            where: { id: destinationId },
            data: {
                userRating: newUserRating,
                userReviewCount: newUserReviewCount,
                ...(recommendationScore !== undefined && { recommendationScore }),
            },
        });
    }
}
