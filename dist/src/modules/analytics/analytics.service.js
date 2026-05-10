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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let AnalyticsService = class AnalyticsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPublicDashboard() {
        const [totalDestinations, totalReviews, sentimentCounts, topTopics, topRecommendations,] = await Promise.all([
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
        const topicIds = topTopics.map((t) => t.topicId);
        const topics = await this.prisma.topic.findMany({
            where: { id: { in: topicIds } },
            select: { id: true, topicName: true },
        });
        const topicMap = new Map(topics.map((t) => [t.id, t.topicName]));
        const sentimentDist = this.buildSentimentDist(sentimentCounts);
        return {
            total_destinations: totalDestinations,
            total_reviews: totalReviews,
            sentiment_distribution: sentimentDist,
            top_topics: topTopics.map((t) => ({
                topic_name: topicMap.get(t.topicId) ?? 'Unknown',
                count: t._sum.totalReviews ?? 0,
            })),
            top_recommendations: topRecommendations,
        };
    }
    async getAdminSummary() {
        const [userCounts, activeDestCount, deletedDestCount, scrapedReviewCount, userReviewCount, scrapingJobCounts, sentimentCounts, topDestinations, latestScrapingJobs,] = await Promise.all([
            this.prisma.user.groupBy({
                by: ['status'],
                _count: { status: true },
            }),
            this.prisma.destination.count({ where: { deletedAt: null } }),
            this.prisma.destination.count({ where: { deletedAt: { not: null } } }),
            this.prisma.review.count(),
            this.prisma.userReview.count(),
            this.prisma.scrapingJob.groupBy({
                by: ['status'],
                _count: { status: true },
            }),
            this.prisma.review.groupBy({
                by: ['sentiment'],
                _count: { sentiment: true },
                where: { sentiment: { not: null } },
            }),
            this.prisma.destination.findMany({
                where: { deletedAt: null, recommendationScore: { not: null } },
                orderBy: { recommendationScore: 'desc' },
                take: 5,
                select: {
                    id: true,
                    name: true,
                    city: true,
                    recommendationScore: true,
                    positiveRatio: true,
                    googleRating: true,
                },
            }),
            this.prisma.scrapingJob.findMany({
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: {
                    destination: { select: { name: true, city: true } },
                },
            }),
        ]);
        const userBreakdown = {};
        for (const u of userCounts) {
            userBreakdown[u.status] = u._count.status;
        }
        const jobBreakdown = {};
        for (const j of scrapingJobCounts) {
            jobBreakdown[j.status] = j._count.status;
        }
        return {
            total_users: Object.values(userBreakdown).reduce((a, b) => a + b, 0),
            users_breakdown: userBreakdown,
            total_destinations: activeDestCount,
            destinations_breakdown: {
                active: activeDestCount,
                deleted: deletedDestCount,
            },
            total_reviews: scrapedReviewCount + userReviewCount,
            reviews_breakdown: {
                scraped: scrapedReviewCount,
                user_submitted: userReviewCount,
            },
            total_scraping_jobs: Object.values(jobBreakdown).reduce((a, b) => a + b, 0),
            scraping_jobs_breakdown: jobBreakdown,
            sentiment_distribution: this.buildSentimentDist(sentimentCounts),
            top_destinations: topDestinations,
            latest_scraping_jobs: latestScrapingJobs,
        };
    }
    async getAdminActivity() {
        const [recentJobs, recentScrapedReviews, recentUserReviews, recentUsers] = await Promise.all([
            this.prisma.scrapingJob.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: {
                    destination: { select: { name: true } },
                },
            }),
            this.prisma.review.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: {
                    id: true,
                    reviewerName: true,
                    rating: true,
                    sentiment: true,
                    createdAt: true,
                    destination: { select: { name: true } },
                },
            }),
            this.prisma.userReview.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: {
                    id: true,
                    rating: true,
                    reviewText: true,
                    createdAt: true,
                    user: { select: { name: true } },
                    destination: { select: { name: true } },
                },
            }),
            this.prisma.user.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    status: true,
                    createdAt: true,
                },
            }),
        ]);
        return {
            recent_scraping_jobs: recentJobs,
            recent_scraped_reviews: recentScrapedReviews,
            recent_user_reviews: recentUserReviews,
            recent_registrations: recentUsers,
        };
    }
    async getAdminTrends(period = 'monthly') {
        const now = new Date();
        let dateFrom;
        if (period === 'daily') {
            dateFrom = new Date(now);
            dateFrom.setDate(now.getDate() - 30);
        }
        else if (period === 'weekly') {
            dateFrom = new Date(now);
            dateFrom.setDate(now.getDate() - 84);
        }
        else {
            dateFrom = new Date(now);
            dateFrom.setMonth(now.getMonth() - 12);
        }
        const trends = await this.prisma.sentimentTrend.findMany({
            where: { date: { gte: dateFrom } },
            orderBy: { date: 'asc' },
            select: {
                date: true,
                positiveCount: true,
                negativeCount: true,
                neutralCount: true,
            },
        });
        const grouped = new Map();
        for (const t of trends) {
            const key = this.getPeriodKey(t.date, period);
            const existing = grouped.get(key) ?? {
                positive: 0,
                negative: 0,
                neutral: 0,
                total: 0,
            };
            const pos = existing.positive + t.positiveCount;
            const neg = existing.negative + t.negativeCount;
            const neu = existing.neutral + t.neutralCount;
            grouped.set(key, {
                positive: pos,
                negative: neg,
                neutral: neu,
                total: pos + neg + neu,
            });
        }
        const result = Array.from(grouped.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, counts]) => ({ date, ...counts }));
        return { period, trends: result };
    }
    async getDestinationAnalytics(destinationId) {
        const destination = await this.prisma.destination.findFirst({
            where: { id: destinationId, deletedAt: null },
            select: {
                id: true,
                name: true,
                googleRating: true,
                userRating: true,
                positiveRatio: true,
                recommendationScore: true,
            },
        });
        if (!destination) {
            throw new common_1.NotFoundException('Destinasi tidak ditemukan');
        }
        const [sentimentCounts, totalReviews, avgRating] = await Promise.all([
            this.prisma.review.groupBy({
                by: ['sentiment'],
                _count: { sentiment: true },
                where: { destinationId, sentiment: { not: null } },
            }),
            this.prisma.review.count({ where: { destinationId } }),
            this.prisma.review.aggregate({
                where: { destinationId, rating: { not: null } },
                _avg: { rating: true },
            }),
        ]);
        return {
            destination_id: destination.id,
            destination_name: destination.name,
            total_reviews: totalReviews,
            sentiment_distribution: this.buildSentimentDist(sentimentCounts),
            average_rating: avgRating._avg.rating ?? destination.googleRating ?? null,
            positive_ratio: destination.positiveRatio,
            recommendation_score: destination.recommendationScore,
        };
    }
    async getDestinationTopics(destinationId) {
        const destination = await this.prisma.destination.findFirst({
            where: { id: destinationId, deletedAt: null },
            select: { id: true },
        });
        if (!destination) {
            throw new common_1.NotFoundException('Destinasi tidak ditemukan');
        }
        const destTopics = await this.prisma.destinationTopic.findMany({
            where: { destinationId },
            include: { topic: { select: { topicName: true } } },
            orderBy: { totalReviews: 'desc' },
        });
        const total = destTopics.reduce((sum, t) => sum + t.totalReviews, 0);
        const topics = destTopics.map((t) => ({
            topic_name: t.topic.topicName,
            total_reviews: t.totalReviews,
            percentage: total > 0 ? Math.round((t.totalReviews / total) * 100) : 0,
        }));
        return { topics };
    }
    async getDestinationTrends(destinationId, period = 'monthly') {
        const destination = await this.prisma.destination.findFirst({
            where: { id: destinationId, deletedAt: null },
            select: { id: true },
        });
        if (!destination) {
            throw new common_1.NotFoundException('Destinasi tidak ditemukan');
        }
        const rawTrends = await this.prisma.sentimentTrend.findMany({
            where: { destinationId },
            orderBy: { date: 'asc' },
            select: {
                date: true,
                positiveCount: true,
                negativeCount: true,
                neutralCount: true,
            },
        });
        const grouped = new Map();
        for (const t of rawTrends) {
            const key = this.getPeriodKey(t.date, period);
            const existing = grouped.get(key) ?? {
                positive: 0,
                negative: 0,
                neutral: 0,
            };
            grouped.set(key, {
                positive: existing.positive + t.positiveCount,
                negative: existing.negative + t.negativeCount,
                neutral: existing.neutral + t.neutralCount,
            });
        }
        const trends = Array.from(grouped.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, counts]) => ({ date, ...counts }));
        return { trends };
    }
    async compareDestinations(id1, id2) {
        const [dest1, dest2] = await Promise.all([
            this.getDestinationSnapshot(id1),
            this.getDestinationSnapshot(id2),
        ]);
        if (!dest1) {
            throw new common_1.BadRequestException(`Destinasi dengan id ${id1} tidak ditemukan`);
        }
        if (!dest2) {
            throw new common_1.BadRequestException(`Destinasi dengan id ${id2} tidak ditemukan`);
        }
        const sentimentWinner = (dest1.positive_ratio ?? 0) >= (dest2.positive_ratio ?? 0) ? id1 : id2;
        const ratingWinner = (dest1.rating.google ?? 0) >= (dest2.rating.google ?? 0) ? id1 : id2;
        const recommendationWinner = (dest1.recommendation_score ?? 0) >= (dest2.recommendation_score ?? 0)
            ? id1
            : id2;
        const scoreDiff = Math.abs((dest1.recommendation_score ?? 0) - (dest2.recommendation_score ?? 0));
        return {
            destination1: dest1,
            destination2: dest2,
            comparison: {
                sentiment_winner: sentimentWinner,
                rating_winner: ratingWinner,
                recommendation_winner: recommendationWinner,
                score_difference: Math.round(scoreDiff * 1000) / 1000,
            },
        };
    }
    async exportAnalyticsCsv(destinationId) {
        const destination = await this.prisma.destination.findFirst({
            where: { id: destinationId, deletedAt: null },
            select: { id: true, name: true },
        });
        if (!destination) {
            throw new common_1.NotFoundException('Destinasi tidak ditemukan');
        }
        const reviews = await this.prisma.review.findMany({
            where: { destinationId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                reviewerName: true,
                rating: true,
                reviewText: true,
                cleanedText: true,
                sentiment: true,
                reviewDate: true,
                likesCount: true,
                topic: { select: { topicName: true } },
            },
        });
        const totalReviews = reviews.length;
        const positiveCount = reviews.filter((r) => r.sentiment === 'positive').length;
        const negativeCount = reviews.filter((r) => r.sentiment === 'negative').length;
        const neutralCount = reviews.filter((r) => r.sentiment === 'neutral').length;
        const rows = [
            `# Destination: ${destination.name}`,
            `# Total Reviews: ${totalReviews} | Positive: ${positiveCount} | Negative: ${negativeCount} | Neutral: ${neutralCount}`,
            `# Exported at: ${new Date().toISOString()}`,
            'id,reviewer_name,rating,sentiment,topic,review_date,likes_count,review_text',
        ];
        const escape = (v) => {
            const s = v === null || v === undefined
                ? ''
                : v instanceof Date
                    ? v.toISOString()
                    : String(v);
            return `"${s.replace(/"/g, '""')}"`;
        };
        for (const r of reviews) {
            rows.push([
                r.id,
                escape(r.reviewerName),
                r.rating ?? '',
                escape(r.sentiment),
                escape(r.topic?.topicName),
                escape(r.reviewDate),
                r.likesCount ?? 0,
                escape(r.reviewText),
            ].join(','));
        }
        const slug = destination.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '');
        const filename = `analytics_${slug}.csv`;
        return { csv: rows.join('\n'), filename };
    }
    async recalculateAnalytics(destinationId) {
        const destination = await this.prisma.destination.findFirst({
            where: { id: destinationId, deletedAt: null },
            select: { id: true, name: true, googleRating: true },
        });
        if (!destination) {
            throw new common_1.NotFoundException('Destinasi tidak ditemukan');
        }
        const sentimentReviews = await this.prisma.review.findMany({
            where: { destinationId, sentiment: { not: null } },
            select: { sentiment: true },
        });
        const totalSentimentReviews = sentimentReviews.length;
        let positiveRatio = 0;
        if (totalSentimentReviews > 0) {
            const positiveCount = sentimentReviews.filter((r) => r.sentiment === 'positive').length;
            positiveRatio = positiveCount / totalSentimentReviews;
        }
        const userRatingAgg = await this.prisma.userReview.aggregate({
            where: { destinationId },
            _avg: { rating: true },
            _count: { rating: true },
        });
        const userRating = userRatingAgg._avg.rating ?? destination.googleRating ?? 0;
        const userReviewCount = userRatingAgg._count.rating;
        const normalizedRating = userRating / 5;
        const recommendationScore = normalizedRating * 0.5 + positiveRatio * 0.5;
        await this.prisma.destination.update({
            where: { id: destinationId },
            data: {
                positiveRatio,
                recommendationScore,
                userRating: userRatingAgg._avg.rating ?? null,
                userReviewCount,
            },
        });
        const topicReviews = await this.prisma.review.findMany({
            where: { destinationId, topicId: { not: null } },
            select: { topicId: true },
        });
        const topicCounts = {};
        for (const r of topicReviews) {
            const tId = r.topicId;
            topicCounts[tId] = (topicCounts[tId] ?? 0) + 1;
        }
        for (const [topicIdStr, count] of Object.entries(topicCounts)) {
            const topicId = parseInt(topicIdStr, 10);
            await this.prisma.destinationTopic.upsert({
                where: { destinationId_topicId: { destinationId, topicId } },
                create: { destinationId, topicId, totalReviews: count },
                update: { totalReviews: count },
            });
        }
        const topicsCount = Object.keys(topicCounts).length;
        const allReviewsWithDate = await this.prisma.review.findMany({
            where: { destinationId, reviewDate: { not: null } },
            select: { reviewDate: true, sentiment: true },
        });
        const trendMap = {};
        for (const r of allReviewsWithDate) {
            if (!r.reviewDate)
                continue;
            const d = r.reviewDate;
            const key = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
            if (!trendMap[key])
                trendMap[key] = { pos: 0, neg: 0, neu: 0 };
            if (r.sentiment === 'positive')
                trendMap[key].pos++;
            else if (r.sentiment === 'negative')
                trendMap[key].neg++;
            else
                trendMap[key].neu++;
        }
        for (const [dateStr, counts] of Object.entries(trendMap)) {
            const date = new Date(dateStr);
            await this.prisma.sentimentTrend.upsert({
                where: { destinationId_date: { destinationId, date } },
                create: {
                    destinationId,
                    date,
                    positiveCount: counts.pos,
                    negativeCount: counts.neg,
                    neutralCount: counts.neu,
                },
                update: {
                    positiveCount: counts.pos,
                    negativeCount: counts.neg,
                    neutralCount: counts.neu,
                },
            });
        }
        const totalReviews = await this.prisma.review.count({ where: { destinationId } });
        return {
            message: 'Analytics recalculated',
            destination_id: destinationId,
            positive_ratio: Math.round(positiveRatio * 1000) / 1000,
            recommendation_score: Math.round(recommendationScore * 1000) / 1000,
            total_reviews: totalReviews,
            topics_count: topicsCount,
        };
    }
    buildSentimentDist(counts) {
        const dist = {
            positive: 0,
            negative: 0,
            neutral: 0,
        };
        for (const c of counts) {
            if (c.sentiment && c.sentiment in dist) {
                dist[c.sentiment] = c._count.sentiment;
            }
        }
        return dist;
    }
    getPeriodKey(date, period) {
        const d = new Date(date);
        if (period === 'daily') {
            return d.toISOString().slice(0, 10);
        }
        if (period === 'weekly') {
            const day = d.getDay();
            const diffToMonday = day === 0 ? -6 : 1 - day;
            const monday = new Date(d);
            monday.setDate(d.getDate() + diffToMonday);
            return monday.toISOString().slice(0, 10);
        }
        return d.toISOString().slice(0, 7);
    }
    async getDestinationSnapshot(id) {
        const dest = await this.prisma.destination.findFirst({
            where: { id, deletedAt: null },
            select: {
                id: true,
                name: true,
                googleRating: true,
                userRating: true,
                positiveRatio: true,
                recommendationScore: true,
                destinationTopics: {
                    include: { topic: { select: { topicName: true } } },
                    orderBy: { totalReviews: 'desc' },
                    take: 5,
                },
            },
        });
        if (!dest)
            return null;
        const sentimentCounts = await this.prisma.review.groupBy({
            by: ['sentiment'],
            _count: { sentiment: true },
            where: { destinationId: id, sentiment: { not: null } },
        });
        return {
            id: dest.id,
            name: dest.name,
            sentiment: this.buildSentimentDist(sentimentCounts),
            topics: dest.destinationTopics.map((t) => ({
                topic_name: t.topic.topicName,
                total_reviews: t.totalReviews,
            })),
            rating: {
                google: dest.googleRating,
                user: dest.userRating,
            },
            recommendation_score: dest.recommendationScore,
            positive_ratio: dest.positiveRatio,
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map