import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SimilarDestination } from './interfaces/similar-destination.interface';

interface HybridSearchFilters {
  city?: string;
  category?: string;
  topicIds?: number[];
  minRating?: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

@Injectable()
// Menjalankan operasi pgvector untuk embedding review dan destinasi.
export class VectorService {
  constructor(private readonly prisma: PrismaService) {}

  // Memecah array besar agar insert embedding berjalan bertahap.
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

  // Menyimpan atau memperbarui embedding untuk satu review.
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

  // Menyimpan banyak embedding review dalam chunk kecil.
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

  // Mencari destinasi paling mirip berdasarkan jarak embedding.
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

  // Menggabungkan similarity, rating, sentimen, dan filter pencarian.
  async hybridSearch(
    queryEmbedding: number[],
    limit: number = 10,
    sortType: 'relevance' | 'hybrid' = 'hybrid',
    filters: HybridSearchFilters = {},
  ): Promise<SimilarDestination[]> {
    const vectorStr = `[${queryEmbedding.join(',')}]`;
    const whereSql = Prisma.join(
      this.buildHybridWhereClauses(filters),
      ' AND ',
    );

    if (sortType === 'relevance') {
      return this.searchByRelevance(vectorStr, whereSql, limit);
    }

    return this.searchByHybridScore(vectorStr, whereSql, limit);
  }

  private buildHybridWhereClauses(filters: HybridSearchFilters) {
    const whereClauses: Prisma.Sql[] = [
      Prisma.sql`d.embedding IS NOT NULL`,
      Prisma.sql`d.deleted_at IS NULL`,
    ];

    this.addCityFilter(whereClauses, filters.city);
    this.addCategoryFilter(whereClauses, filters.category);
    this.addMinRatingFilter(whereClauses, filters.minRating);
    this.addTopicFilter(whereClauses, filters.topicIds);
    this.addSentimentFilter(whereClauses, filters.sentiment);

    return whereClauses;
  }

  private addCityFilter(whereClauses: Prisma.Sql[], city?: string) {
    if (city) whereClauses.push(Prisma.sql`LOWER(d.city) = LOWER(${city})`);
  }

  private addCategoryFilter(whereClauses: Prisma.Sql[], category?: string) {
    if (!category) return;
    whereClauses.push(Prisma.sql`LOWER(d.category) = LOWER(${category})`);
  }

  private addMinRatingFilter(whereClauses: Prisma.Sql[], minRating?: number) {
    if (minRating == null) return;
    whereClauses.push(
      Prisma.sql`COALESCE(d.user_rating, d.google_rating, 0) >= ${minRating}`,
    );
  }

  private addTopicFilter(whereClauses: Prisma.Sql[], topicIds?: number[]) {
    if (!topicIds || topicIds.length === 0) return;
    whereClauses.push(Prisma.sql`EXISTS (
        SELECT 1 FROM destination_topics dt
        WHERE dt.destination_id = d.id
          AND dt.topic_id IN (${Prisma.join(topicIds)})
      )`);
  }

  private addSentimentFilter(
    whereClauses: Prisma.Sql[],
    sentiment?: 'positive' | 'negative' | 'neutral',
  ) {
    if (!sentiment) return;
    whereClauses.push(Prisma.sql`EXISTS (
        SELECT 1 FROM reviews r
        WHERE r.destination_id = d.id
          AND r.sentiment = ${sentiment}
      )`);
  }

  private searchByRelevance(
    vectorStr: string,
    whereSql: Prisma.Sql,
    limit: number,
  ) {
    return this.prisma.$queryRaw<SimilarDestination[]>`
        SELECT
          d.id, d.name, d.slug, d.city, d.province, d.category,
          d.thumbnail_url, d.google_rating, d.user_rating,
          d.positive_ratio, d.recommendation_score,
          1 - (d.embedding <=> ${vectorStr}::vector) AS similarity
        FROM destinations d
        WHERE ${whereSql}
        ORDER BY similarity DESC
        LIMIT ${limit}
      `;
  }

  private searchByHybridScore(
    vectorStr: string,
    whereSql: Prisma.Sql,
    limit: number,
  ) {
    return this.prisma.$queryRaw<SimilarDestination[]>`
      SELECT
        d.id, d.name, d.slug, d.city, d.province, d.category,
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
