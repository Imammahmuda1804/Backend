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
        const ratingSummary = await this.getUserReviewRatingSummary(destinationId);
        const recommendationScore = await this.calculateUserRecommendationScore(destinationId, ratingSummary.rating);
        await this.prisma.destination.update({
            where: { id: destinationId },
            data: {
                userRating: ratingSummary.rating,
                userReviewCount: ratingSummary.count,
                ...(recommendationScore !== undefined && { recommendationScore }),
            },
        });
    }
    async getUserReviewRatingSummary(destinationId) {
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
    async calculateUserRecommendationScore(destinationId, userRating) {
        if (userRating === null)
            return undefined;
        const sentimentReviews = await this.findReviewsWithSentiment(destinationId);
        if (sentimentReviews.length === 0)
            return undefined;
        const positiveRatio = this.countPositiveReviews(sentimentReviews) / sentimentReviews.length;
        return (userRating / 5) * 0.5 + positiveRatio * 0.5;
    }
    findReviewsWithSentiment(destinationId) {
        return this.prisma.review.findMany({
            where: { destinationId, sentiment: { not: null } },
            select: { sentiment: true },
        });
    }
    countPositiveReviews(reviews) {
        return reviews.filter((review) => review.sentiment === 'positive').length;
    }
    async getReviewsByDestination(destinationId, page, limit, sentiment, topicId, dateFrom, dateTo, sortBy, nlpStatus) {
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
    buildDestinationReviewFilter(input) {
        return {
            destinationId: input.destinationId,
            ...(input.sentiment && { sentiment: input.sentiment }),
            ...(input.topicId && { topicId: input.topicId }),
            ...this.buildReviewDateFilter(input.dateFrom, input.dateTo),
            ...this.buildReviewNlpFilter(input.nlpStatus),
        };
    }
    buildReviewDateFilter(dateFrom, dateTo) {
        if (!dateFrom && !dateTo)
            return {};
        return {
            reviewDate: this.buildReviewDateRange(dateFrom, dateTo),
        };
    }
    buildReviewDateRange(dateFrom, dateTo) {
        const range = {};
        if (dateFrom)
            range.gte = new Date(dateFrom);
        if (dateTo)
            range.lte = this.endOfDay(dateTo);
        return range;
    }
    endOfDay(date) {
        return new Date(new Date(date).setHours(23, 59, 59, 999));
    }
    buildReviewNlpFilter(nlpStatus) {
        if (nlpStatus === 'processed')
            return { cleanedText: { not: null } };
        if (nlpStatus === 'unprocessed')
            return { cleanedText: null };
        return {};
    }
    getReviewOrder(sortBy) {
        return sortBy === 'oldest' ? { reviewDate: 'asc' } : { reviewDate: 'desc' };
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