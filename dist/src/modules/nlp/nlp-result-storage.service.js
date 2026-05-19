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
exports.NlpResultStorageService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const vector_service_1 = require("../vector/vector.service");
const ai_naming_service_1 = require("./ai-naming.service");
let NlpResultStorageService = class NlpResultStorageService {
    prisma;
    vectorService;
    aiNamingService;
    constructor(prisma, vectorService, aiNamingService) {
        this.prisma = prisma;
        this.vectorService = vectorService;
        this.aiNamingService = aiNamingService;
    }
    async saveNlpResults(destinationId, nlpResult, reviewIds) {
        console.log('📊 NLP Result Summary:', JSON.stringify(nlpResult.summary, null, 2));
        console.log('📊 NLP Result Topics:', JSON.stringify(nlpResult.topics?.slice(0, 3), null, 2));
        console.log('📊 NLP Result Results (first 2):', JSON.stringify(nlpResult.results?.slice(0, 2), null, 2));
        if (nlpResult.new_topics && nlpResult.new_topics.length > 0) {
            console.log(`🆕 ${nlpResult.new_topics.length} new topics discovered by BIRCH clustering!`);
            console.log('🆕 New Topics:', JSON.stringify(nlpResult.new_topics, null, 2));
        }
        if (nlpResult.warning) {
            console.warn('⚠️ Pipeline Warning:', nlpResult.warning);
        }
        if (nlpResult.metadata) {
            console.log('NLP Model Metadata:', JSON.stringify(nlpResult.metadata, null, 2));
        }
        const mapSentiment = (sentiment) => {
            const sentimentMap = {
                positif: 'positive',
                negatif: 'negative',
                netral: 'neutral',
            };
            return sentimentMap[sentiment.toLowerCase()] || sentiment;
        };
        const savedTopicIds = new Set();
        if (nlpResult.topics && Array.isArray(nlpResult.topics)) {
            for (const topic of nlpResult.topics) {
                if (!topic.topic_id && topic.topic_id !== 0) {
                    console.warn('⚠️ Skipping topic with no topic_id:', topic);
                    continue;
                }
                const topicId = topic.topic_id;
                const existingTopic = await this.prisma.topic.findUnique({
                    where: { id: topicId },
                });
                let topicName = existingTopic?.topicName;
                if (!existingTopic) {
                    console.log(`🤖 Generating AI name for new topic ${topicId}...`);
                    topicName = await this.aiNamingService.generateTopicName(topicId, topic.keywords, topic.representative_docs ?? []);
                }
                else {
                    topicName =
                        topicName ||
                            `Topic ${topicId}: ${topic.keywords.slice(0, 3).join(', ')}`;
                }
                await this.prisma.topic.upsert({
                    where: { id: topicId },
                    create: {
                        id: topicId,
                        topicName: topicName,
                        keywords: topic.keywords,
                    },
                    update: {
                        keywords: topic.keywords,
                    },
                });
                savedTopicIds.add(topicId);
            }
        }
        if (nlpResult.results && Array.isArray(nlpResult.results)) {
            for (let index = 0; index < nlpResult.results.length; index++) {
                const review = nlpResult.results[index];
                const realReviewId = review.review_id ?? reviewIds[index];
                const mappedSentiment = mapSentiment(review.sentiment);
                const safeTopicId = review.topic_id != null && savedTopicIds.has(review.topic_id)
                    ? review.topic_id
                    : null;
                await this.prisma.review.update({
                    where: { id: realReviewId },
                    data: {
                        cleanedText: review.cleaned_text,
                        sentiment: mappedSentiment,
                        sentimentConfidence: review.sentiment_confidence,
                        topicId: safeTopicId,
                    },
                });
            }
        }
        const embeddingsToInsert = (nlpResult.results || [])
            .filter((r) => r.embedding && r.embedding.length > 0)
            .map((r, index) => ({
            reviewId: r.review_id ?? reviewIds[index],
            embedding: r.embedding,
        }));
        if (embeddingsToInsert.length > 0) {
            await this.vectorService.batchInsertReviewEmbeddings(embeddingsToInsert);
        }
        if (nlpResult.results && nlpResult.results.length > 0) {
            const validEmbeddings = nlpResult.results.reduce((acc, result) => {
                if (result.embedding.length > 0) {
                    acc.push(result.embedding);
                }
                return acc;
            }, []);
            if (validEmbeddings.length > 0) {
                const embeddingDim = validEmbeddings[0].length;
                const destinationEmbedding = Array.from({ length: embeddingDim }, () => 0);
                for (const embedding of validEmbeddings) {
                    for (let i = 0; i < embeddingDim; i++) {
                        destinationEmbedding[i] =
                            (destinationEmbedding[i] ?? 0) + (embedding[i] ?? 0);
                    }
                }
                for (let i = 0; i < embeddingDim; i++) {
                    destinationEmbedding[i] /= validEmbeddings.length;
                }
                const norm = Math.sqrt(destinationEmbedding.reduce((sum, value) => sum + value * value, 0));
                if (norm > 0) {
                    for (let i = 0; i < embeddingDim; i++) {
                        destinationEmbedding[i] /= norm;
                    }
                }
                await this.vectorService.upsertDestinationEmbedding(destinationId, destinationEmbedding);
            }
        }
        await this.calculateRecommendationScore(destinationId);
        await this.updateDestinationTopics(destinationId);
        await this.updateSentimentTrends(destinationId);
    }
    async calculateRecommendationScore(destinationId) {
        const reviews = await this.prisma.review.findMany({
            where: { destinationId, sentiment: { not: null } },
            select: { sentiment: true },
        });
        const totalReviews = reviews.length;
        if (totalReviews === 0)
            return;
        const positiveCount = reviews.filter((r) => r.sentiment === 'positive').length;
        const positiveRatio = positiveCount / totalReviews;
        const dest = await this.prisma.destination.findUnique({
            where: { id: destinationId },
            select: { userRating: true, googleRating: true },
        });
        const userRating = dest?.userRating ?? dest?.googleRating ?? 0;
        const ratingWeight = 0.5;
        const sentimentWeight = 0.5;
        const normalizedRating = userRating / 5;
        const recommendationScore = normalizedRating * ratingWeight + positiveRatio * sentimentWeight;
        await this.prisma.destination.update({
            where: { id: destinationId },
            data: {
                positiveRatio,
                recommendationScore,
            },
        });
    }
    async updateDestinationTopics(destinationId) {
        const reviews = await this.prisma.review.findMany({
            where: { destinationId, topicId: { not: null } },
            select: { topicId: true },
        });
        const topicCounts = {};
        for (const r of reviews) {
            const tId = r.topicId;
            topicCounts[tId] = (topicCounts[tId] || 0) + 1;
        }
        for (const [topicIdStr, count] of Object.entries(topicCounts)) {
            const topicId = parseInt(topicIdStr, 10);
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
        const reviews = await this.prisma.review.findMany({
            where: { destinationId, reviewDate: { not: null } },
            select: { reviewDate: true, sentiment: true },
        });
        const trends = {};
        for (const r of reviews) {
            if (!r.reviewDate)
                continue;
            const dateStr = new Date(r.reviewDate.getFullYear(), r.reviewDate.getMonth(), 1).toISOString();
            if (!trends[dateStr]) {
                trends[dateStr] = { pos: 0, neg: 0, neu: 0 };
            }
            if (r.sentiment === 'positive')
                trends[dateStr].pos++;
            else if (r.sentiment === 'negative')
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
exports.NlpResultStorageService = NlpResultStorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        vector_service_1.VectorService,
        ai_naming_service_1.AiNamingService])
], NlpResultStorageService);
//# sourceMappingURL=nlp-result-storage.service.js.map