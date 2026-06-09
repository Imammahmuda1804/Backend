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
var SearchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const nlp_service_1 = require("../nlp/nlp.service");
const vector_service_1 = require("../vector/vector.service");
const nlp_unavailable_exception_1 = require("../nlp/exceptions/nlp-unavailable.exception");
let SearchService = SearchService_1 = class SearchService {
    prisma;
    nlpService;
    vectorService;
    logger = new common_1.Logger(SearchService_1.name);
    constructor(prisma, nlpService, vectorService) {
        this.prisma = prisma;
        this.nlpService = nlpService;
        this.vectorService = vectorService;
    }
    async semanticSearch(dto, userId) {
        const limit = Math.min(dto.limit ?? 10, 50);
        this.logger.log(`Search request: "${dto.query}" by user ${userId || 'guest'}`);
        const embedding = await this.getSearchEmbedding(dto.query);
        const results = await this.vectorService.hybridSearch(embedding, limit, dto.sort, this.buildSearchFilters(dto));
        const enrichedResults = await this.attachTopTopics(results);
        await this.saveSearchHistory(dto.query, userId);
        this.logger.log(`Semantic search: "${dto.query}" -> ${results.length} results` +
            (userId ? ` (user ${userId})` : ' (guest)'));
        return enrichedResults;
    }
    async getSearchEmbedding(query) {
        try {
            return await this.nlpService.embedQuery(query);
        }
        catch (error) {
            if (error instanceof nlp_unavailable_exception_1.NlpServiceUnavailableException) {
                throw new common_1.ServiceUnavailableException('NLP service sedang tidak tersedia, coba beberapa saat lagi');
            }
            throw error;
        }
    }
    buildSearchFilters(dto) {
        return {
            city: dto.city,
            category: dto.category,
            topicIds: dto.topicIds ?? dto.topic_ids,
            minRating: dto.minRating ?? dto.min_rating,
            sentiment: dto.sentiment,
        };
    }
    async saveSearchHistory(query, userId) {
        if (!userId) {
            this.logger.log('No userId provided - search history not saved');
            return;
        }
        try {
            await this.prisma.searchLog.create({
                data: { userId, keyword: query },
            });
            this.logger.log(`Search history saved for user ${userId}: "${query}"`);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.error(`Failed to save search log for user ${userId}: ${message}`);
        }
    }
    async attachTopTopics(results) {
        if (results.length === 0)
            return results;
        const destinations = await this.prisma.destination.findMany({
            where: { id: { in: results.map((result) => result.id) } },
            select: {
                id: true,
                destinationTopics: {
                    orderBy: { totalReviews: 'desc' },
                    take: 3,
                    select: {
                        totalReviews: true,
                        topic: {
                            select: {
                                id: true,
                                topicName: true,
                            },
                        },
                    },
                },
            },
        });
        const topicMap = new Map(destinations.map((destination) => [
            destination.id,
            destination.destinationTopics.map((item) => ({
                id: item.topic.id,
                name: item.topic.topicName,
                topic_name: item.topic.topicName,
                total_reviews: item.totalReviews,
            })),
        ]));
        return results.map((result) => ({
            ...result,
            topics: topicMap.get(result.id) ?? [],
        }));
    }
    async getHistory(userId, page, limit) {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.searchLog.findMany({
                where: { userId },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    keyword: true,
                    createdAt: true,
                },
            }),
            this.prisma.searchLog.count({ where: { userId } }),
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
    async clearHistory(userId) {
        const { count } = await this.prisma.searchLog.deleteMany({
            where: { userId },
        });
        return {
            message: 'Search history cleared',
            deleted_count: count,
        };
    }
    async deleteHistoryEntry(entryId, userId) {
        const entry = await this.prisma.searchLog.findUnique({
            where: { id: entryId },
        });
        if (!entry) {
            throw new common_1.NotFoundException('Riwayat pencarian tidak ditemukan');
        }
        if (entry.userId !== userId) {
            throw new common_1.ForbiddenException('Anda tidak memiliki akses ke riwayat pencarian ini');
        }
        await this.prisma.searchLog.delete({ where: { id: entryId } });
        return { message: 'Search history entry deleted' };
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = SearchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        nlp_service_1.NlpService,
        vector_service_1.VectorService])
], SearchService);
//# sourceMappingURL=search.service.js.map