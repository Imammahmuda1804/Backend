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
var NlpResultStorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NlpResultStorageService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const vector_service_1 = require("../vector/vector.service");
const ai_naming_service_1 = require("./ai-naming.service");
const nlp_result_util_1 = require("./utils/nlp-result.util");
const topics_service_1 = require("../topics/topics.service");
let NlpResultStorageService = NlpResultStorageService_1 = class NlpResultStorageService {
    prisma;
    vectorService;
    aiNamingService;
    logger = new common_1.Logger(NlpResultStorageService_1.name);
    constructor(prisma, vectorService, aiNamingService) {
        this.prisma = prisma;
        this.vectorService = vectorService;
        this.aiNamingService = aiNamingService;
    }
    async saveNlpResults(destinationId, nlpResult, reviewIds) {
        this.logPipelineResult(destinationId, nlpResult);
        const savedTopicIds = await this.saveTopics(nlpResult);
        await this.updateReviews(nlpResult, reviewIds, savedTopicIds);
        await this.saveReviewEmbeddings(nlpResult, reviewIds);
        await this.saveDestinationEmbedding(destinationId, nlpResult);
        await this.calculateRecommendationScore(destinationId);
        await this.updateDestinationTopics(destinationId);
        await this.updateSentimentTrends(destinationId);
    }
    logPipelineResult(destinationId, nlpResult) {
        this.logger.log(`NLP result summary for destination ${destinationId}: ${JSON.stringify(nlpResult.summary)}`);
        if (nlpResult.new_topics && nlpResult.new_topics.length > 0) {
            this.logger.log(`${nlpResult.new_topics.length} new topics discovered by NLP pipeline`);
        }
        if (nlpResult.warning) {
            this.logger.warn(`Pipeline warning: ${nlpResult.warning}`);
        }
        if (nlpResult.metadata) {
            this.logger.log(`NLP model metadata: ${JSON.stringify(nlpResult.metadata)}`);
        }
    }
    async saveTopics(nlpResult) {
        const savedTopicIds = new Map();
        const topicGroups = await this.prisma.topicGroup.findMany({
            orderBy: { displayOrder: 'asc' },
            select: { id: true, groupName: true, keywords: true },
        });
        const groupCandidates = topicGroups.map((group) => ({
            id: group.id,
            groupName: group.groupName,
            keywords: Array.isArray(group.keywords)
                ? group.keywords
                : [],
        }));
        if (!Array.isArray(nlpResult.topics))
            return savedTopicIds;
        for (const topic of nlpResult.topics) {
            if (!topic.topic_id && topic.topic_id !== 0) {
                this.logger.warn(`Skipping topic with no topic_id: ${JSON.stringify(topic)}`);
                continue;
            }
            const topicId = topic.topic_id;
            const keywords = Array.isArray(topic.keywords) ? topic.keywords : [];
            const representativeDocs = topic.representative_docs ?? [];
            const existingTopic = await this.prisma.topic.findUnique({
                where: { id: topicId },
            });
            let topicName = existingTopic?.topicName;
            if (!existingTopic) {
                this.logger.log(`Generating AI name for new topic ${topicId}`);
                topicName = await this.aiNamingService.generateTopicName(topicId, keywords, representativeDocs);
            }
            else {
                topicName =
                    topicName || `Topic ${topicId}: ${keywords.slice(0, 3).join(', ')}`;
            }
            const groupId = existingTopic?.groupId ??
                this.aiNamingService.classifyTopicGroup(topicName, keywords, representativeDocs, groupCandidates);
            const duplicateTopic = await this.findTopicByNormalizedName(topicName, topicId);
            if (duplicateTopic) {
                this.logger.log(`Topic ${topicId} named "${topicName}" matches existing topic ${duplicateTopic.id}. Mapping reviews to existing topic.`);
                await this.prisma.topic.update({
                    where: { id: duplicateTopic.id },
                    data: {
                        keywords: this.mergeTopicKeywords(duplicateTopic.keywords, keywords),
                        ...(duplicateTopic.groupId ? {} : { groupId }),
                    },
                });
                savedTopicIds.set(topicId, duplicateTopic.id);
                continue;
            }
            await this.prisma.topic.upsert({
                where: { id: topicId },
                create: {
                    id: topicId,
                    topicName,
                    keywords,
                    groupId,
                },
                update: {
                    keywords,
                    ...(existingTopic?.groupId ? {} : { groupId }),
                },
            });
            savedTopicIds.set(topicId, topicId);
        }
        return savedTopicIds;
    }
    async findTopicByNormalizedName(topicName, excludeId) {
        const normalized = (0, topics_service_1.normalizeTopicNameForMatch)(topicName);
        const candidates = await this.prisma.topic.findMany({
            where: { id: { not: excludeId } },
            select: { id: true, topicName: true, keywords: true, groupId: true },
        });
        return (candidates.find((topic) => (0, topics_service_1.normalizeTopicNameForMatch)(topic.topicName) === normalized) ?? null);
    }
    mergeTopicKeywords(existingKeywords, newKeywords) {
        const merged = [];
        const addKeyword = (keyword) => {
            const value = String(keyword).trim();
            if (value &&
                !merged.some((item) => (0, topics_service_1.normalizeTopicNameForMatch)(item) ===
                    (0, topics_service_1.normalizeTopicNameForMatch)(value))) {
                merged.push(value);
            }
        };
        if (Array.isArray(existingKeywords)) {
            existingKeywords.forEach(addKeyword);
        }
        newKeywords.forEach(addKeyword);
        return merged.slice(0, 20);
    }
    async updateReviews(nlpResult, reviewIds, savedTopicIds) {
        if (!Array.isArray(nlpResult.results))
            return;
        for (let index = 0; index < nlpResult.results.length; index++) {
            const review = nlpResult.results[index];
            const realReviewId = review.review_id ?? reviewIds[index];
            if (!realReviewId)
                continue;
            const safeTopicId = review.topic_id != null
                ? (savedTopicIds.get(review.topic_id) ?? null)
                : null;
            await this.prisma.review.update({
                where: { id: realReviewId },
                data: {
                    cleanedText: review.cleaned_text,
                    sentiment: (0, nlp_result_util_1.mapPipelineSentiment)(review.sentiment),
                    sentimentConfidence: review.sentiment_confidence,
                    topicId: safeTopicId,
                },
            });
        }
    }
    async saveReviewEmbeddings(nlpResult, reviewIds) {
        const embeddingsToInsert = (nlpResult.results || [])
            .filter((result) => result.embedding && result.embedding.length > 0)
            .map((result, index) => ({
            reviewId: result.review_id ?? reviewIds[index],
            embedding: result.embedding,
        }))
            .filter((item) => Boolean(item.reviewId));
        if (embeddingsToInsert.length > 0) {
            await this.vectorService.batchInsertReviewEmbeddings(embeddingsToInsert);
        }
    }
    async saveDestinationEmbedding(destinationId, nlpResult) {
        const validEmbeddings = (nlpResult.results || [])
            .map((result) => result.embedding)
            .filter((embedding) => embedding && embedding.length > 0);
        const destinationEmbedding = (0, nlp_result_util_1.averageAndNormalizeEmbeddings)(validEmbeddings);
        if (destinationEmbedding) {
            await this.vectorService.upsertDestinationEmbedding(destinationId, destinationEmbedding);
        }
    }
    async calculateRecommendationScore(destinationId) {
        const reviews = await this.prisma.review.findMany({
            where: { destinationId, sentiment: { not: null } },
            select: { sentiment: true },
        });
        const totalReviews = reviews.length;
        if (totalReviews === 0)
            return;
        const positiveCount = reviews.filter((review) => review.sentiment === 'positive').length;
        const positiveRatio = positiveCount / totalReviews;
        const dest = await this.prisma.destination.findUnique({
            where: { id: destinationId },
            select: { userRating: true, googleRating: true },
        });
        const userRating = dest?.userRating ?? dest?.googleRating ?? 0;
        const recommendationScore = (userRating / 5) * 0.5 + positiveRatio * 0.5;
        await this.prisma.destination.update({
            where: { id: destinationId },
            data: {
                positiveRatio,
                recommendationScore,
            },
        });
    }
    async updateDestinationTopics(destinationId) {
        await this.prisma.destinationTopic.deleteMany({
            where: { destinationId },
        });
        const reviews = await this.prisma.review.findMany({
            where: { destinationId, topicId: { not: null } },
            select: { topicId: true },
        });
        const topicCounts = {};
        for (const review of reviews) {
            const topicId = review.topicId;
            topicCounts[topicId] = (topicCounts[topicId] || 0) + 1;
        }
        for (const [topicIdStr, count] of Object.entries(topicCounts)) {
            const topicId = Number(topicIdStr);
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
                    totalReviews: count,
                },
                update: {
                    totalReviews: count,
                },
            });
        }
    }
    async updateSentimentTrends(destinationId) {
        await this.prisma.sentimentTrend.deleteMany({
            where: { destinationId },
        });
        const reviews = await this.prisma.review.findMany({
            where: { destinationId, reviewDate: { not: null } },
            select: { reviewDate: true, sentiment: true },
        });
        const trends = {};
        for (const review of reviews) {
            if (!review.reviewDate)
                continue;
            const dateStr = new Date(review.reviewDate.getFullYear(), review.reviewDate.getMonth(), 1).toISOString();
            trends[dateStr] ??= { pos: 0, neg: 0, neu: 0 };
            if (review.sentiment === 'positive')
                trends[dateStr].pos++;
            else if (review.sentiment === 'negative')
                trends[dateStr].neg++;
            else
                trends[dateStr].neu++;
        }
        for (const [dateStr, counts] of Object.entries(trends)) {
            const date = new Date(dateStr);
            await this.prisma.sentimentTrend.upsert({
                where: {
                    destinationId_date: {
                        destinationId,
                        date,
                    },
                },
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
    }
};
exports.NlpResultStorageService = NlpResultStorageService;
exports.NlpResultStorageService = NlpResultStorageService = NlpResultStorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        vector_service_1.VectorService,
        ai_naming_service_1.AiNamingService])
], NlpResultStorageService);
//# sourceMappingURL=nlp-result-storage.service.js.map