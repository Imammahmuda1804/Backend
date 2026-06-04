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
exports.normalizeTopicNameForMatch = normalizeTopicNameForMatch;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const ai_naming_service_1 = require("../nlp/ai-naming.service");
function normalizeTopicNameForMatch(value) {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
}
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
                const duplicate = await this.findTopicByNormalizedName(newName, topic.id);
                if (duplicate) {
                    await this.mergeTopics(duplicate.id, [topic.id]);
                    this.logger.log(`Merged topic ${topic.id}: "${topic.topicName}" → existing "${duplicate.topicName}"`);
                    renamed++;
                }
                else {
                    await this.prisma.topic.update({
                        where: { id: topic.id },
                        data: { topicName: newName },
                    });
                    this.logger.log(`Renamed topic ${topic.id}: "${topic.topicName}" → "${newName}"`);
                    renamed++;
                }
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
    async findReviewsByTopic(topicId, page, limit, sentiment, destinationId) {
        const topic = await this.prisma.topic.findUnique({
            where: { id: topicId },
            select: {
                id: true,
                topicName: true,
                group: { select: { id: true, groupName: true } },
            },
        });
        if (!topic)
            throw new common_1.NotFoundException('Topic tidak ditemukan');
        const take = Math.min(Math.max(limit, 1), 50);
        const skip = (Math.max(page, 1) - 1) * take;
        const sentimentValues = this.mapSentimentFilter(sentiment);
        const where = {
            topicId,
            ...(destinationId ? { destinationId } : {}),
            ...(sentimentValues.length > 0
                ? { sentiment: { in: sentimentValues } }
                : {}),
            destination: { deletedAt: null },
        };
        const [reviews, total, sentimentRows] = await Promise.all([
            this.prisma.review.findMany({
                where,
                skip,
                take,
                orderBy: [{ reviewDate: 'desc' }, { createdAt: 'desc' }],
                select: {
                    id: true,
                    reviewerName: true,
                    reviewText: true,
                    rating: true,
                    reviewDate: true,
                    sentiment: true,
                    sentimentConfidence: true,
                    destination: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            city: true,
                            province: true,
                            thumbnailUrl: true,
                        },
                    },
                },
            }),
            this.prisma.review.count({ where }),
            this.prisma.review.groupBy({
                by: ['sentiment'],
                where: {
                    topicId,
                    ...(destinationId ? { destinationId } : {}),
                    destination: { deletedAt: null },
                },
                _count: { _all: true },
            }),
        ]);
        return {
            topic: {
                id: topic.id,
                topic_name: topic.topicName,
                group: topic.group
                    ? { id: topic.group.id, group_name: topic.group.groupName }
                    : null,
            },
            sentiment_summary: this.normalizeSentimentSummary(sentimentRows),
            data: reviews.map((review) => ({
                id: review.id,
                reviewer_name: review.reviewerName,
                review_text: review.reviewText,
                rating: review.rating,
                review_date: review.reviewDate,
                sentiment: review.sentiment,
                sentiment_confidence: review.sentimentConfidence,
                destination: review.destination,
            })),
            meta: {
                page,
                limit: take,
                total,
                total_pages: Math.ceil(total / take),
            },
        };
    }
    async renameTopic(topicId, newName) {
        const topic = await this.prisma.topic.findUnique({
            where: { id: topicId },
        });
        if (!topic)
            throw new common_1.NotFoundException('Topic tidak ditemukan');
        const duplicate = await this.findTopicByNormalizedName(newName, topicId);
        if (duplicate) {
            return this.mergeTopics(duplicate.id, [topicId]);
        }
        const updated = await this.prisma.topic.update({
            where: { id: topicId },
            data: { topicName: newName },
            select: { id: true, topicName: true },
        });
        this.logger.log(`Topic ${topicId} renamed to "${newName}"`);
        return updated;
    }
    async findTopicByNormalizedName(topicName, excludeId) {
        const normalized = normalizeTopicNameForMatch(topicName);
        const candidates = await this.prisma.topic.findMany({
            where: excludeId ? { id: { not: excludeId } } : undefined,
            select: { id: true, topicName: true },
        });
        return (candidates.find((topic) => normalizeTopicNameForMatch(topic.topicName) === normalized) ?? null);
    }
    async mergeTopics(targetTopicId, sourceTopicIds) {
        const uniqueSourceIds = [...new Set(sourceTopicIds)].filter((id) => id !== targetTopicId);
        if (uniqueSourceIds.length === 0) {
            throw new common_1.BadRequestException('Pilih minimal satu topic sumber yang berbeda dari target');
        }
        const topics = await this.prisma.topic.findMany({
            where: { id: { in: [targetTopicId, ...uniqueSourceIds] } },
            select: { id: true, topicName: true, keywords: true },
        });
        const target = topics.find((topic) => topic.id === targetTopicId);
        if (!target)
            throw new common_1.NotFoundException('Topic target tidak ditemukan');
        const existingSourceIds = new Set(topics
            .filter((topic) => topic.id !== targetTopicId)
            .map((topic) => topic.id));
        const missing = uniqueSourceIds.filter((id) => !existingSourceIds.has(id));
        if (missing.length > 0) {
            throw new common_1.NotFoundException(`Topic sumber tidak ditemukan: ${missing.join(', ')}`);
        }
        const sourceTopics = topics.filter((topic) => topic.id !== targetTopicId);
        const mergedKeywords = this.mergeTopicKeywords(target.keywords, sourceTopics.map((topic) => topic.keywords));
        await this.prisma.$transaction(async (tx) => {
            const sourceDestinationTopics = await tx.destinationTopic.findMany({
                where: { topicId: { in: uniqueSourceIds } },
            });
            for (const sourceLink of sourceDestinationTopics) {
                const targetLink = await tx.destinationTopic.findUnique({
                    where: {
                        destinationId_topicId: {
                            destinationId: sourceLink.destinationId,
                            topicId: targetTopicId,
                        },
                    },
                });
                if (targetLink) {
                    await tx.destinationTopic.update({
                        where: { id: targetLink.id },
                        data: { totalReviews: { increment: sourceLink.totalReviews } },
                    });
                    await tx.destinationTopic.delete({ where: { id: sourceLink.id } });
                }
                else {
                    await tx.destinationTopic.update({
                        where: { id: sourceLink.id },
                        data: { topicId: targetTopicId },
                    });
                }
            }
            await tx.review.updateMany({
                where: { topicId: { in: uniqueSourceIds } },
                data: { topicId: targetTopicId },
            });
            await tx.topic.update({
                where: { id: targetTopicId },
                data: { keywords: mergedKeywords },
            });
            await tx.topic.deleteMany({ where: { id: { in: uniqueSourceIds } } });
        });
        this.logger.log(`Merged topics [${uniqueSourceIds.join(', ')}] into ${targetTopicId}`);
        return {
            merged: true,
            target_topic_id: targetTopicId,
            target_topic_name: target.topicName,
            source_topic_ids: uniqueSourceIds,
            deleted_topics: uniqueSourceIds.length,
        };
    }
    mergeTopicKeywords(targetKeywords, sourceKeywordLists) {
        const merged = [];
        const addKeywords = (value) => {
            if (!Array.isArray(value))
                return;
            for (const keyword of value) {
                const normalized = String(keyword).trim();
                if (normalized &&
                    !merged.some((item) => normalizeTopicNameForMatch(item) ===
                        normalizeTopicNameForMatch(normalized))) {
                    merged.push(normalized);
                }
            }
        };
        addKeywords(targetKeywords);
        for (const keywords of sourceKeywordLists)
            addKeywords(keywords);
        return merged.slice(0, 20);
    }
    mapSentimentFilter(sentiment) {
        if (sentiment === 'positive')
            return ['positive', 'positif'];
        if (sentiment === 'neutral')
            return ['neutral', 'netral'];
        if (sentiment === 'negative')
            return ['negative', 'negatif'];
        return [];
    }
    normalizeSentimentSummary(rows) {
        const summary = { positive: 0, neutral: 0, negative: 0, unknown: 0 };
        rows.forEach((row) => {
            const value = (row.sentiment || '').toLowerCase();
            if (value === 'positive' || value === 'positif') {
                summary.positive += row._count._all;
            }
            else if (value === 'neutral' || value === 'netral') {
                summary.neutral += row._count._all;
            }
            else if (value === 'negative' || value === 'negatif') {
                summary.negative += row._count._all;
            }
            else {
                summary.unknown += row._count._all;
            }
        });
        return summary;
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
    async createGroup(data) {
        const created = await this.prisma.topicGroup.create({
            data: {
                groupName: data.groupName.trim(),
                description: data.description?.trim() || null,
                keywords: this.normalizeKeywords(data.keywords),
                displayOrder: data.displayOrder ?? 0,
            },
            select: {
                id: true,
                groupName: true,
                description: true,
                keywords: true,
                displayOrder: true,
            },
        });
        return {
            id: created.id,
            group_name: created.groupName,
            description: created.description,
            keywords: created.keywords,
            display_order: created.displayOrder,
            topics: [],
        };
    }
    async updateGroup(groupId, data) {
        const group = await this.prisma.topicGroup.findUnique({
            where: { id: groupId },
            select: { id: true },
        });
        if (!group)
            throw new common_1.NotFoundException('Topic group tidak ditemukan');
        const updated = await this.prisma.topicGroup.update({
            where: { id: groupId },
            data: {
                groupName: data.groupName.trim(),
                description: data.description?.trim() || null,
                keywords: this.normalizeKeywords(data.keywords),
                displayOrder: data.displayOrder ?? 0,
            },
            select: {
                id: true,
                groupName: true,
                description: true,
                keywords: true,
                displayOrder: true,
                topics: {
                    select: {
                        id: true,
                        topicName: true,
                        keywords: true,
                        isSearchVisible: true,
                        isDetailVisible: true,
                        _count: { select: { destinationTopics: true } },
                    },
                },
            },
        });
        return {
            id: updated.id,
            group_name: updated.groupName,
            description: updated.description,
            keywords: updated.keywords,
            display_order: updated.displayOrder,
            topics: updated.topics.map((topic) => ({
                id: topic.id,
                topic_name: topic.topicName,
                keywords: topic.keywords,
                is_search_visible: topic.isSearchVisible,
                is_detail_visible: topic.isDetailVisible,
                total_destinations: topic._count.destinationTopics,
            })),
        };
    }
    async deleteGroup(groupId) {
        const group = await this.prisma.topicGroup.findUnique({
            where: { id: groupId },
            select: { id: true, groupName: true },
        });
        if (!group)
            throw new common_1.NotFoundException('Topic group tidak ditemukan');
        await this.prisma.topicGroup.delete({ where: { id: groupId } });
        return { deleted: true, id: group.id, group_name: group.groupName };
    }
    normalizeKeywords(keywords) {
        const clean = (keywords ?? [])
            .map((keyword) => keyword.trim())
            .filter(Boolean);
        return [...new Set(clean)].slice(0, 24);
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