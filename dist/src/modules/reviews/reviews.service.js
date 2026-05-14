"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ReviewsService = class ReviewsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createUserReview(userId, dto) {
        const destination = await this.prisma.destination.findFirst({
            where: { id: dto.destination_id, deletedAt: null },
            select: { id: true },
        });
        if (!destination) {
            throw new common_1.NotFoundException('Destinasi tidak ditemukan');
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
        });
        return {
            id: review.id,
            destination_id: review.destinationId,
            rating: review.rating,
            review_text: review.reviewText,
            created_at: review.createdAt,
        };
    }
    async deleteReview(reviewId) {
        const review = await this.prisma.review.findUnique({
            where: { id: reviewId },
            select: { id: true, destinationId: true },
        });
        if (!review) {
            throw new common_1.NotFoundException('Review tidak ditemukan');
        }
        await this.prisma.review.delete({ where: { id: reviewId } });
        return { message: 'Review deleted' };
    }
    async deleteUserReview(userReviewId) {
        const userReview = await this.prisma.userReview.findUnique({
            where: { id: userReviewId },
            select: { id: true, destinationId: true },
        });
        if (!userReview) {
            throw new common_1.NotFoundException('User review tidak ditemukan');
        }
        await this.prisma.userReview.delete({ where: { id: userReviewId } });
        this.recalculateUserRating(userReview.destinationId).catch(() => { });
        return { message: 'User review deleted' };
    }
    async recalculateUserRating(destinationId) {
        const agg = await this.prisma.userReview.aggregate({
            where: { destinationId },
            _avg: { rating: true },
            _count: { rating: true },
        });
        const newUserRating = agg._avg.rating ?? null;
        const newUserReviewCount = agg._count.rating;
        const sentimentReviews = await this.prisma.review.findMany({
            where: { destinationId, sentiment: { not: null } },
            select: { sentiment: true },
        });
        let recommendationScore;
        if (sentimentReviews.length > 0 && newUserRating !== null) {
            const positiveCount = sentimentReviews.filter((r) => r.sentiment === 'positive').length;
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
    async getReviewsByDestination(destinationId, page, limit, sentiment, topicId, dateFrom, dateTo, sortBy, nlpStatus) {
        const skip = (page - 1) * limit;
        const where = {
            destinationId,
            ...(sentiment && { sentiment }),
            ...(topicId && { topicId }),
            ...(dateFrom || dateTo
                ? {
                    reviewDate: {
                        ...(dateFrom && { gte: new Date(dateFrom) }),
                        ...(dateTo && { lte: new Date(new Date(dateTo).setHours(23, 59, 59, 999)) }),
                    },
                }
                : {}),
            ...(nlpStatus === 'processed' && { cleanedText: { not: null } }),
            ...(nlpStatus === 'unprocessed' && { cleanedText: null }),
        };
        const orderBy = sortBy === 'oldest'
            ? { reviewDate: 'asc' }
            : { reviewDate: 'desc' };
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
    async deleteBulkReviews(destinationId, category) {
        const whereClause = { destinationId };
        if (category === 'processed') {
            whereClause.cleanedText = { not: null };
        }
        else if (category === 'unprocessed') {
            whereClause.cleanedText = null;
        }
        const result = await this.prisma.review.deleteMany({
            where: whereClause,
        });
        return { message: `${result.count} review berhasil dihapus` };
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map