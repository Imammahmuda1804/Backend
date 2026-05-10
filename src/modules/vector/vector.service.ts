import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SimilarDestination } from './interfaces/similar-destination.interface';

@Injectable()
export class VectorService {
  constructor(private readonly prisma: PrismaService) {}

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunked: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunked.push(array.slice(i, i + size));
    }
    return chunked;
  }

  async upsertDestinationEmbedding(
    destinationId: number,
    embedding: number[],
  ): Promise<void> {
    const vectorStr = `[${embedding.join(',')}]`;
    await this.prisma.$executeRaw`
      UPDATE destinations
      SET embedding = ${vectorStr}::vector
      WHERE id = ${destinationId}
    `;
  }

  async insertReviewEmbedding(
    reviewId: number,
    embedding: number[],
  ): Promise<void> {
    const vectorStr = `[${embedding.join(',')}]`;
    await this.prisma.$executeRaw`
      INSERT INTO review_embeddings (review_id, embedding)
      VALUES (${reviewId}, ${vectorStr}::vector)
      ON CONFLICT (review_id)
      DO UPDATE SET embedding = ${vectorStr}::vector
    `;
  }

  async batchInsertReviewEmbeddings(
    items: Array<{ reviewId: number; embedding: number[] }>,
  ): Promise<void> {
    for (const chunk of this.chunkArray(items, 100)) {
      await Promise.all(
        chunk.map((item) =>
          this.insertReviewEmbedding(item.reviewId, item.embedding),
        ),
      );
    }
  }

  async searchSimilarDestinations(
    queryEmbedding: number[],
    limit: number = 10,
  ): Promise<SimilarDestination[]> {
    const vectorStr = `[${queryEmbedding.join(',')}]`;
    return this.prisma.$queryRaw<SimilarDestination[]>`
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

  async hybridSearch(
    queryEmbedding: number[],
    limit: number = 10,
  ): Promise<SimilarDestination[]> {
    const vectorStr = `[${queryEmbedding.join(',')}]`;
    return this.prisma.$queryRaw<SimilarDestination[]>`
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
}
