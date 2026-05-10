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
exports.TopicsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let TopicsService = class TopicsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        const topics = await this.prisma.topic.findMany({
            orderBy: { id: 'asc' },
            select: {
                id: true,
                topicName: true,
                keywords: true,
                _count: {
                    select: { destinationTopics: true },
                },
            },
        });
        return topics.map((t) => ({
            id: t.id,
            topic_name: t.topicName,
            keywords: t.keywords,
            total_destinations: t._count.destinationTopics,
        }));
    }
    async findDestinationsByTopic(topicId, page, limit) {
        const topic = await this.prisma.topic.findUnique({
            where: { id: topicId },
            select: { id: true, topicName: true },
        });
        if (!topic) {
            throw new common_1.NotFoundException('Topic tidak ditemukan');
        }
        const skip = (page - 1) * limit;
        const [destTopics, total] = await Promise.all([
            this.prisma.destinationTopic.findMany({
                where: {
                    topicId,
                    destination: { deletedAt: null },
                },
                skip,
                take: limit,
                orderBy: { totalReviews: 'desc' },
                select: {
                    totalReviews: true,
                    destination: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            city: true,
                            province: true,
                            thumbnailUrl: true,
                            positiveRatio: true,
                            recommendationScore: true,
                        },
                    },
                },
            }),
            this.prisma.destinationTopic.count({
                where: {
                    topicId,
                    destination: { deletedAt: null },
                },
            }),
        ]);
        const data = destTopics.map((dt) => ({
            ...dt.destination,
            total_reviews_in_topic: dt.totalReviews,
        }));
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
};
exports.TopicsService = TopicsService;
exports.TopicsService = TopicsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TopicsService);
//# sourceMappingURL=topics.service.js.map