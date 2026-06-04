"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DestinationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const fs_1 = require("fs");
const path = __importStar(require("path"));
const slug_util_1 = require("../../common/utils/slug.util");
const destination_categories_1 = require("./destination-categories");
let DestinationsService = class DestinationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const existingDestinations = await this.prisma.destination.findMany({
            select: { slug: true },
        });
        const existingSlugs = existingDestinations.map((d) => d.slug);
        const uniqueSlug = (0, slug_util_1.generateUniqueSlug)(dto.name, existingSlugs);
        try {
            return await this.prisma.destination.create({
                data: {
                    name: dto.name,
                    slug: uniqueSlug,
                    description: dto.description,
                    city: dto.city,
                    province: dto.province,
                    category: dto.category,
                    latitude: dto.latitude,
                    longitude: dto.longitude,
                    googlePlaceId: dto.googlePlaceId,
                    googleMapsUrl: dto.googleMapsUrl,
                    youtubeUrl: dto.youtubeUrl,
                    thumbnailUrl: dto.thumbnailUrl,
                    googleRating: dto.googleRating,
                    googleReviewCount: dto.googleReviewCount,
                },
            });
        }
        catch (error) {
            if (error &&
                typeof error === 'object' &&
                'code' in error &&
                error.code === 'P2002') {
                throw new common_1.ConflictException('Destinasi dengan nama ini mungkin sudah ada');
            }
            throw error;
        }
    }
    async findAll(page, limit, search, topicId, topicIds, city, category) {
        const skip = (page - 1) * limit;
        const effectiveTopicIds = topicIds && topicIds.length > 0 ? topicIds : topicId ? [topicId] : [];
        const whereCondition = {
            deletedAt: null,
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { city: { contains: search, mode: 'insensitive' } },
                ],
            }),
            ...(effectiveTopicIds.length > 0 && {
                destinationTopics: {
                    some: {
                        topicId: { in: effectiveTopicIds },
                    },
                },
            }),
            ...(city && {
                city: { equals: city, mode: 'insensitive' },
            }),
            ...(category && {
                category: { equals: category, mode: 'insensitive' },
            }),
        };
        const [data, total] = await Promise.all([
            this.prisma.destination.findMany({
                where: whereCondition,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    images: true,
                    destinationTopics: {
                        orderBy: { totalReviews: 'desc' },
                        take: 3,
                        include: {
                            topic: {
                                select: {
                                    id: true,
                                    topicName: true,
                                    keywords: true,
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.destination.count({
                where: whereCondition,
            }),
        ]);
        return {
            data: data.map((destination) => ({
                ...destination,
                topics: destination.destinationTopics.map((item) => ({
                    id: item.topic.id,
                    name: item.topic.topicName,
                    topic_name: item.topic.topicName,
                    keywords: item.topic.keywords,
                    total_reviews: item.totalReviews,
                })),
            })),
            meta: {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit),
            },
        };
    }
    getCategories() {
        return destination_categories_1.DESTINATION_CATEGORIES;
    }
    async getCities() {
        const results = await this.prisma.destination.findMany({
            where: { deletedAt: null },
            select: { city: true },
            distinct: ['city'],
            orderBy: { city: 'asc' },
        });
        return results.map((r) => r.city).filter(Boolean);
    }
    async findOneAdmin(id) {
        const destination = await this.prisma.destination.findUnique({
            where: { id },
            include: {
                images: true,
                sentimentTrends: {
                    orderBy: { date: 'desc' },
                    take: 30,
                },
                scrapingJobs: {
                    orderBy: { startedAt: 'desc' },
                    take: 5,
                },
                destinationTopics: {
                    include: {
                        topic: {
                            include: {
                                group: true,
                            },
                        },
                    },
                },
            },
        });
        if (!destination) {
            throw new common_1.NotFoundException('Destinasi tidak ditemukan');
        }
        return destination;
    }
    async update(id, dto) {
        const destination = await this.prisma.destination.findUnique({
            where: { id },
        });
        if (!destination) {
            throw new common_1.NotFoundException('Destinasi tidak ditemukan');
        }
        return this.prisma.destination.update({
            where: { id },
            data: {
                name: dto.name,
                description: dto.description,
                city: dto.city,
                province: dto.province,
                category: dto.category,
                latitude: dto.latitude,
                longitude: dto.longitude,
                googlePlaceId: dto.googlePlaceId,
                googleMapsUrl: dto.googleMapsUrl,
                youtubeUrl: dto.youtubeUrl,
                thumbnailUrl: dto.thumbnailUrl,
                ...(dto.googleRating !== undefined && {
                    googleRating: dto.googleRating,
                }),
                ...(dto.googleReviewCount !== undefined && {
                    googleReviewCount: dto.googleReviewCount,
                }),
            },
        });
    }
    async softDelete(id) {
        const destination = await this.prisma.destination.findUnique({
            where: { id },
        });
        if (!destination) {
            throw new common_1.NotFoundException('Destinasi tidak ditemukan');
        }
        return this.prisma.destination.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    async updateMapsUrl(id, dto) {
        const destination = await this.prisma.destination.findUnique({
            where: { id },
        });
        if (!destination) {
            throw new common_1.NotFoundException('Destinasi tidak ditemukan');
        }
        return this.prisma.destination.update({
            where: { id },
            data: { googleMapsUrl: dto.googleMapsUrl },
        });
    }
    async uploadThumbnail(destinationId, filename) {
        const destination = await this.prisma.destination.findUnique({
            where: { id: destinationId },
        });
        if (!destination) {
            const filepath = path.join(process.cwd(), 'uploads', 'destinations', filename);
            await this.removeFileIfExists(filepath);
            throw new common_1.NotFoundException('Destinasi tidak ditemukan');
        }
        if (destination.thumbnailUrl?.startsWith('/uploads/')) {
            const oldFilename = path.basename(destination.thumbnailUrl);
            const oldFilepath = path.join(process.cwd(), 'uploads', 'destinations', oldFilename);
            await this.removeFileIfExists(oldFilepath);
        }
        const thumbnailUrl = `/uploads/destinations/${filename}`;
        return this.prisma.destination.update({
            where: { id: destinationId },
            data: { thumbnailUrl },
        });
    }
    async uploadImage(destinationId, filename) {
        const destination = await this.prisma.destination.findUnique({
            where: { id: destinationId },
        });
        if (!destination) {
            const filepath = path.join(process.cwd(), 'uploads', 'destinations', filename);
            await this.removeFileIfExists(filepath);
            throw new common_1.NotFoundException('Destinasi tidak ditemukan');
        }
        const imageUrl = `/uploads/destinations/${filename}`;
        return this.prisma.destinationImage.create({
            data: {
                destinationId,
                imageUrl,
            },
        });
    }
    async deleteImage(imageId) {
        const image = await this.prisma.destinationImage.findUnique({
            where: { id: imageId },
        });
        if (!image) {
            throw new common_1.NotFoundException('Image tidak ditemukan');
        }
        const filename = path.basename(image.imageUrl);
        const filepath = path.join(process.cwd(), 'uploads', 'destinations', filename);
        await this.removeFileIfExists(filepath);
        return this.prisma.destinationImage.delete({
            where: { id: imageId },
        });
    }
    async findRecommendations(page, limit) {
        const skip = (page - 1) * limit;
        const whereCondition = { deletedAt: null };
        const [data, total] = await Promise.all([
            this.prisma.destination.findMany({
                where: whereCondition,
                skip,
                take: limit,
                orderBy: { recommendationScore: 'desc' },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    description: true,
                    city: true,
                    province: true,
                    latitude: true,
                    longitude: true,
                    googlePlaceId: true,
                    googleMapsUrl: true,
                    thumbnailUrl: true,
                    googleRating: true,
                    userRating: true,
                    positiveRatio: true,
                    recommendationScore: true,
                },
            }),
            this.prisma.destination.count({
                where: whereCondition,
            }),
        ]);
        return {
            data,
            meta: {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit),
            },
        };
    }
    async findOnePublic(id) {
        const destination = await this.prisma.destination.findFirst({
            where: { id, deletedAt: null },
            include: {
                images: true,
                sentimentTrends: {
                    orderBy: { date: 'desc' },
                    take: 30,
                },
                destinationTopics: {
                    include: {
                        topic: true,
                    },
                },
                userReviews: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                profilePicture: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!destination) {
            throw new common_1.NotFoundException('Destinasi tidak ditemukan');
        }
        const reviewAgg = await this.prisma.userReview.aggregate({
            where: { destinationId: id },
            _avg: { rating: true },
            _count: true,
        });
        const scrapedAgg = await this.prisma.review.aggregate({
            where: { destinationId: id },
            _avg: { rating: true },
            _count: { rating: true },
        });
        const topicSentimentBreakdown = await this.buildTopicSentimentBreakdown(id);
        const topicGroups = await this.buildTopicGroups(id);
        return {
            ...destination,
            averageUserRating: reviewAgg._avg.rating || null,
            totalUserReviews: reviewAgg._count,
            scrapedAverageRating: scrapedAgg._avg.rating
                ? parseFloat(scrapedAgg._avg.rating.toFixed(2))
                : destination.userRating,
            scrapedReviewCount: scrapedAgg._count.rating,
            topicSentimentBreakdown,
            topicGroups,
        };
    }
    async findOnePublicBySlug(slug) {
        const destination = await this.prisma.destination.findFirst({
            where: { slug, deletedAt: null },
            include: {
                images: true,
                sentimentTrends: {
                    orderBy: { date: 'asc' },
                    take: 30,
                },
                destinationTopics: {
                    include: {
                        topic: {
                            include: {
                                group: true,
                            },
                        },
                    },
                },
                userReviews: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                profilePicture: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!destination) {
            throw new common_1.NotFoundException('Destinasi tidak ditemukan');
        }
        const reviewAgg = await this.prisma.userReview.aggregate({
            where: { destinationId: destination.id },
            _avg: { rating: true },
            _count: true,
        });
        const scrapedAgg = await this.prisma.review.aggregate({
            where: { destinationId: destination.id },
            _avg: { rating: true },
            _count: { rating: true },
        });
        const topicSentimentBreakdown = await this.buildTopicSentimentBreakdown(destination.id);
        const topicGroups = await this.buildTopicGroups(destination.id);
        return {
            ...destination,
            averageUserRating: reviewAgg._avg.rating || null,
            totalUserReviews: reviewAgg._count,
            scrapedAverageRating: scrapedAgg._avg.rating
                ? parseFloat(scrapedAgg._avg.rating.toFixed(2))
                : destination.userRating,
            scrapedReviewCount: scrapedAgg._count.rating,
            topicSentimentBreakdown,
            topicGroups,
        };
    }
    async findRanking(sortBy, limit) {
        let orderBy = {
            recommendationScore: 'desc',
        };
        if (sortBy === 'sentiment') {
            orderBy = { positiveRatio: 'desc' };
        }
        else if (sortBy === 'rating') {
            orderBy = { googleRating: 'desc' };
        }
        return this.prisma.destination.findMany({
            where: { deletedAt: null },
            take: limit,
            orderBy,
            select: {
                id: true,
                name: true,
                slug: true,
                city: true,
                province: true,
                latitude: true,
                longitude: true,
                googlePlaceId: true,
                googleMapsUrl: true,
                thumbnailUrl: true,
                googleRating: true,
                userRating: true,
                positiveRatio: true,
                recommendationScore: true,
            },
        });
    }
    async getReviewsByTopic(destinationId, topicId, page, limit) {
        const destination = await this.prisma.destination.findFirst({
            where: { id: destinationId, deletedAt: null },
            select: { id: true },
        });
        if (!destination) {
            throw new common_1.NotFoundException('Destinasi tidak ditemukan');
        }
        const skip = (page - 1) * limit;
        const total = await this.prisma.review.count({
            where: { destinationId, topicId },
        });
        const reviews = await this.prisma.review.findMany({
            where: { destinationId, topicId },
            skip,
            take: limit,
            orderBy: { reviewDate: 'desc' },
            select: {
                id: true,
                reviewerName: true,
                reviewText: true,
                rating: true,
                reviewDate: true,
                sentiment: true,
                likesCount: true,
            },
        });
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
    async getReviewsByTopicGroup(destinationId, groupId, page, limit) {
        const destination = await this.prisma.destination.findFirst({
            where: { id: destinationId, deletedAt: null },
            select: { id: true },
        });
        if (!destination) {
            throw new common_1.NotFoundException('Destinasi tidak ditemukan');
        }
        const topics = await this.prisma.topic.findMany({
            where: { groupId },
            select: { id: true },
        });
        const topicIds = topics.map((topic) => topic.id);
        if (topicIds.length === 0) {
            return {
                data: [],
                meta: { total: 0, page, limit, totalPages: 0 },
            };
        }
        const skip = (page - 1) * limit;
        const where = {
            destinationId,
            topicId: { in: topicIds },
        };
        const [total, reviews] = await Promise.all([
            this.prisma.review.count({ where }),
            this.prisma.review.findMany({
                where,
                skip,
                take: limit,
                orderBy: { reviewDate: 'desc' },
                select: {
                    id: true,
                    reviewerName: true,
                    reviewText: true,
                    rating: true,
                    reviewDate: true,
                    sentiment: true,
                    likesCount: true,
                    topicId: true,
                    topic: {
                        select: {
                            id: true,
                            topicName: true,
                        },
                    },
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
    async buildTopicGroups(destinationId) {
        const grouped = await this.prisma.review.groupBy({
            by: ['topicId', 'sentiment'],
            where: {
                destinationId,
                topicId: { not: null },
            },
            _count: { sentiment: true },
        });
        const topicIds = Array.from(new Set(grouped
            .map((row) => row.topicId)
            .filter((topicId) => topicId !== null)));
        if (topicIds.length === 0)
            return [];
        const topics = await this.prisma.topic.findMany({
            where: {
                id: { in: topicIds },
                isDetailVisible: true,
            },
            include: {
                group: true,
            },
        });
        const fallbackGroup = await this.prisma.topicGroup.findFirst({
            where: { groupName: { contains: 'Lain', mode: 'insensitive' } },
            orderBy: { displayOrder: 'asc' },
        });
        const topicMap = new Map(topics.map((topic) => [topic.id, topic]));
        const groups = new Map();
        for (const row of grouped) {
            if (row.topicId === null)
                continue;
            const topic = topicMap.get(row.topicId);
            if (!topic)
                continue;
            const groupId = topic.groupId ?? fallbackGroup?.id ?? 0;
            const groupName = topic.group?.groupName ?? fallbackGroup?.groupName ?? 'Lainnya';
            const group = groups.get(groupId) ?? {
                groupId,
                groupName,
                totalReviews: 0,
                sentimentBreakdown: { positive: 0, negative: 0, neutral: 0 },
                topics: new Map(),
            };
            const count = row._count.sentiment;
            group.totalReviews += count;
            const sentiment = (row.sentiment || '').toLowerCase();
            if (sentiment === 'positive' || sentiment === 'positif') {
                group.sentimentBreakdown.positive += count;
            }
            else if (sentiment === 'negative' || sentiment === 'negatif') {
                group.sentimentBreakdown.negative += count;
            }
            else {
                group.sentimentBreakdown.neutral += count;
            }
            const fineTopic = group.topics.get(topic.id) ?? {
                id: topic.id,
                topicName: topic.topicName,
                totalReviews: 0,
            };
            fineTopic.totalReviews += count;
            group.topics.set(topic.id, fineTopic);
            groups.set(groupId, group);
        }
        return Array.from(groups.values())
            .map((group) => ({
            groupId: group.groupId,
            groupName: group.groupName,
            totalReviews: group.totalReviews,
            sentimentBreakdown: group.sentimentBreakdown,
            topics: Array.from(group.topics.values()).sort((a, b) => b.totalReviews - a.totalReviews),
        }))
            .sort((a, b) => b.totalReviews - a.totalReviews);
    }
    async buildTopicSentimentBreakdown(destinationId) {
        const grouped = await this.prisma.review.groupBy({
            by: ['topicId', 'sentiment'],
            where: {
                destinationId,
                topicId: { not: null },
                sentiment: { not: null },
            },
            _count: { sentiment: true },
        });
        const breakdown = {};
        for (const row of grouped) {
            if (row.topicId === null)
                continue;
            if (!breakdown[row.topicId]) {
                breakdown[row.topicId] = { positive: 0, negative: 0, neutral: 0 };
            }
            const sentiment = (row.sentiment || '').toLowerCase();
            if (sentiment === 'positive' || sentiment === 'positif') {
                breakdown[row.topicId].positive = row._count.sentiment;
            }
            else if (sentiment === 'negative' || sentiment === 'negatif') {
                breakdown[row.topicId].negative = row._count.sentiment;
            }
            else {
                breakdown[row.topicId].neutral = row._count.sentiment;
            }
        }
        return breakdown;
    }
    async removeFileIfExists(filepath) {
        await fs_1.promises.rm(filepath, { force: true });
    }
};
exports.DestinationsService = DestinationsService;
exports.DestinationsService = DestinationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DestinationsService);
//# sourceMappingURL=destinations.service.js.map