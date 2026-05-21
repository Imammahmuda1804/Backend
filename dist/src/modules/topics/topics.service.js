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
var TopicsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopicsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const ai_naming_service_1 = require("../nlp/ai-naming.service");
let TopicsService = TopicsService_1 = class TopicsService {
    prisma;
    aiNamingService;
    logger = new common_1.Logger(TopicsService_1.name);
    constructor(prisma, aiNamingService) {
        this.prisma = prisma;
        this.aiNamingService = aiNamingService;
    }
    async renameUnnamedTopics() {
        const topics = await this.prisma.topic.findMany({
            where: {
                topicName: { startsWith: 'Topic ' },
            },
            select: { id: true, topicName: true, keywords: true },
        });
        this.logger.log(`Found ${topics.length} topics to rename with AI`);
        let renamed = 0;
        let failed = 0;
        for (const topic of topics) {
            const keywords = Array.isArray(topic.keywords)
                ? topic.keywords
                : [];
            if (keywords.length === 0) {
                failed++;
                continue;
            }
            const newName = await this.aiNamingService.generateTopicName(topic.id, keywords);
            if (!newName.startsWith('Topic ')) {
                await this.prisma.topic.update({
                    where: { id: topic.id },
                    data: { topicName: newName },
                });
                this.logger.log(`Renamed topic ${topic.id}: "${topic.topicName}" → "${newName}"`);
                renamed++;
            }
            else {
                failed++;
            }
        }
        this.logger.log(`Rename complete: ${renamed} renamed, ${failed} failed, ${topics.length} total`);
        return { renamed, failed, total: topics.length };
    }
    async findAll(scope) {
        if (scope === 'detail') {
            return this.findGroups();
        }
        const topics = await this.prisma.topic.findMany({
            where: scope === 'search' ? { isSearchVisible: true } : undefined,
            orderBy: { id: 'asc' },
            select: {
                id: true,
                topicName: true,
                keywords: true,
                labelType: true,
                isSearchVisible: true,
                isDetailVisible: true,
                groupId: true,
                group: {
                    select: {
                        id: true,
                        groupName: true,
                    },
                },
                _count: {
                    select: { destinationTopics: true },
                },
            },
        });
        return topics.map((t) => ({
            id: t.id,
            topic_name: t.topicName,
            keywords: t.keywords,
            label_type: t.labelType,
            is_search_visible: t.isSearchVisible,
            is_detail_visible: t.isDetailVisible,
            group_id: t.groupId,
            group_name: t.group?.groupName ?? null,
            group: t.group
                ? {
                    id: t.group.id,
                    group_name: t.group.groupName,
                }
                : null,
            total_destinations: t._count.destinationTopics,
        }));
    }
    async findGroups() {
        const groups = await this.prisma.topicGroup.findMany({
            orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
            select: {
                id: true,
                groupName: true,
                description: true,
                keywords: true,
                displayOrder: true,
                topics: {
                    where: { isDetailVisible: true },
                    select: {
                        id: true,
                        topicName: true,
                        keywords: true,
                        isSearchVisible: true,
                        isDetailVisible: true,
                        _count: {
                            select: { destinationTopics: true },
                        },
                    },
                    orderBy: { id: 'asc' },
                },
            },
        });
        return groups.map((group) => ({
            id: group.id,
            group_name: group.groupName,
            description: group.description,
            keywords: group.keywords,
            display_order: group.displayOrder,
            topics: group.topics.map((topic) => ({
                id: topic.id,
                topic_name: topic.topicName,
                keywords: topic.keywords,
                is_search_visible: topic.isSearchVisible,
                is_detail_visible: topic.isDetailVisible,
                total_destinations: topic._count.destinationTopics,
            })),
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
    async renameTopic(topicId, newName) {
        const topic = await this.prisma.topic.findUnique({
            where: { id: topicId },
        });
        if (!topic)
            throw new common_1.NotFoundException('Topic tidak ditemukan');
        const updated = await this.prisma.topic.update({
            where: { id: topicId },
            data: { topicName: newName },
            select: { id: true, topicName: true },
        });
        this.logger.log(`Topic ${topicId} renamed to "${newName}"`);
        return updated;
    }
    async updateTopicSettings(topicId, data) {
        const topic = await this.prisma.topic.findUnique({
            where: { id: topicId },
        });
        if (!topic)
            throw new common_1.NotFoundException('Topic tidak ditemukan');
        if (data.groupId) {
            const group = await this.prisma.topicGroup.findUnique({
                where: { id: data.groupId },
                select: { id: true },
            });
            if (!group)
                throw new common_1.NotFoundException('Topic group tidak ditemukan');
        }
        const updated = await this.prisma.topic.update({
            where: { id: topicId },
            data: {
                ...(data.groupId !== undefined ? { groupId: data.groupId } : {}),
                ...(data.isSearchVisible !== undefined
                    ? { isSearchVisible: data.isSearchVisible }
                    : {}),
                ...(data.isDetailVisible !== undefined
                    ? { isDetailVisible: data.isDetailVisible }
                    : {}),
            },
            select: {
                id: true,
                topicName: true,
                groupId: true,
                isSearchVisible: true,
                isDetailVisible: true,
            },
        });
        return {
            id: updated.id,
            topic_name: updated.topicName,
            group_id: updated.groupId,
            is_search_visible: updated.isSearchVisible,
            is_detail_visible: updated.isDetailVisible,
        };
    }
    async renameGroup(groupId, groupName) {
        const group = await this.prisma.topicGroup.findUnique({
            where: { id: groupId },
        });
        if (!group)
            throw new common_1.NotFoundException('Topic group tidak ditemukan');
        const updated = await this.prisma.topicGroup.update({
            where: { id: groupId },
            data: { groupName },
            select: { id: true, groupName: true },
        });
        return { id: updated.id, group_name: updated.groupName };
    }
    async deleteTopic(topicId) {
        const topic = await this.prisma.topic.findUnique({
            where: { id: topicId },
        });
        if (!topic)
            throw new common_1.NotFoundException('Topic tidak ditemukan');
        await this.prisma.$transaction([
            this.prisma.destinationTopic.deleteMany({ where: { topicId } }),
            this.prisma.review.updateMany({
                where: { topicId },
                data: { topicId: null },
            }),
            this.prisma.topic.delete({ where: { id: topicId } }),
        ]);
        this.logger.log(`Topic ${topicId} ("${topic.topicName}") deleted`);
        return { deleted: true, id: topicId };
    }
};
exports.TopicsService = TopicsService;
exports.TopicsService = TopicsService = TopicsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ai_naming_service_1.AiNamingService])
], TopicsService);
//# sourceMappingURL=topics.service.js.map