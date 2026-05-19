import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SimilarDestination } from './interfaces/similar-destination.interface';

interface HybridSearchFilters {
  city?: string;
  topicIds?: number[];
  minRating?: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

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
    sortType: 'relevance' | 'hybrid' = 'hybrid',
    filters: HybridSearchFilters = {},
  ): Promise<SimilarDestination[]> {
    const vectorStr = `[${queryEmbedding.join(',')}]`;
    const whereClauses: Prisma.Sql[] = [
      Prisma.sql`d.embedding IS NOT NULL`,
      Prisma.sql`d.deleted_at IS NULL`,
    ];

    if (filters.city) {
      whereClauses.push(Prisma.sql`LOWER(d.city) = LOWER(${filters.city})`);
    }
    if (filters.minRating != null) {
      whereClauses.push(
        Prisma.sql`COALESCE(d.user_rating, d.google_rating, 0) >= ${filters.minRating}`,
      );
    }
    if (filters.topicIds && filters.topicIds.length > 0) {
      whereClauses.push(Prisma.sql`EXISTS (
        SELECT 1 FROM destination_topics dt
        WHERE dt.destination_id = d.id
          AND dt.topic_id IN (${Prisma.join(filters.topicIds)})
      )`);
    }
    if (filters.sentiment) {
      whereClauses.push(Prisma.sql`EXISTS (
        SELECT 1 FROM reviews r
        WHERE r.destination_id = d.id
          AND r.sentiment = ${filters.sentiment}
      )`);
    }

    const whereSql = Prisma.join(whereClauses, ' AND ');

    if (sortType === 'relevance') {
      return this.prisma.$queryRaw<SimilarDestination[]>`
        SELECT
          d.id, d.name, d.slug, d.city, d.province,
          d.thumbnail_url, d.google_rating, d.user_rating,
          d.positive_ratio, d.recommendation_score,
          1 - (d.embedding <=> ${vectorStr}::vector) AS similarity
        FROM destinations d
        WHERE ${whereSql}
        ORDER BY similarity DESC
        LIMIT ${limit}
      `;
    }

    // Default: hybrid
    return this.prisma.$queryRaw<SimilarDestination[]>`
      SELECT
        d.id, d.name, d.slug, d.city, d.province,
        d.thumbnail_url, d.google_rating, d.user_rating,
        d.positive_ratio, d.recommendation_score,
        (1 - (d.embedding <=> ${vectorStr}::vector)) * 0.4
        + COALESCE(d.positive_ratio, 0) * 0.4
        + COALESCE(d.user_rating, d.google_rating, 0) / 5.0 * 0.2
        AS hybrid_score
      FROM destinations d
      WHERE ${whereSql}
      ORDER BY hybrid_score DESC
      LIMIT ${limit}
    `;
  }
}
