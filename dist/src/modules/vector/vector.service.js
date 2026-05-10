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
exports.VectorService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let VectorService = class VectorService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    chunkArray(array, size) {
        const chunked = [];
        for (let i = 0; i < array.length; i += size) {
            chunked.push(array.slice(i, i + size));
        }
        return chunked;
    }
    async upsertDestinationEmbedding(destinationId, embedding) {
        const vectorStr = `[${embedding.join(',')}]`;
        await this.prisma.$executeRaw `
      UPDATE destinations
      SET embedding = ${vectorStr}::vector
      WHERE id = ${destinationId}
    `;
    }
    async insertReviewEmbedding(reviewId, embedding) {
        const vectorStr = `[${embedding.join(',')}]`;
        await this.prisma.$executeRaw `
      INSERT INTO review_embeddings (review_id, embedding)
      VALUES (${reviewId}, ${vectorStr}::vector)
      ON CONFLICT (review_id)
      DO UPDATE SET embedding = ${vectorStr}::vector
    `;
    }
    async batchInsertReviewEmbeddings(items) {
        for (const chunk of this.chunkArray(items, 100)) {
            await Promise.all(chunk.map((item) => this.insertReviewEmbedding(item.reviewId, item.embedding)));
        }
    }
    async searchSimilarDestinations(queryEmbedding, limit = 10) {
        const vectorStr = `[${queryEmbedding.join(',')}]`;
        return this.prisma.$queryRaw `
      SELECT
        id, name, slug, city, province,
        thumbnail_url, google_rating, user_rating,
        positive_ratio, recommendation_score,
        embedding <=> ${vectorStr}::vector AS distance
      FROM destinations
      WHERE embedding IS NOT NULL
        AND deleted_at IS NULL
      ORDER BY distance ASC
      LIMIT ${limit}
    `;
    }
    async hybridSearch(queryEmbedding, limit = 10) {
        const vectorStr = `[${queryEmbedding.join(',')}]`;
        return this.prisma.$queryRaw `
      SELECT
        id, name, slug, city, province,
        thumbnail_url, google_rating, user_rating,
        positive_ratio, recommendation_score,
        (1 - (embedding <=> ${vectorStr}::vector)) * 0.4
        + COALESCE(positive_ratio, 0) * 0.4
        + COALESCE(user_rating, 0) / 5.0 * 0.2
        AS hybrid_score
      FROM destinations
      WHERE embedding IS NOT NULL
        AND deleted_at IS NULL
      ORDER BY hybrid_score DESC
      LIMIT ${limit}
    `;
    }
};
exports.VectorService = VectorService;
exports.VectorService = VectorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VectorService);
//# sourceMappingURL=vector.service.js.map