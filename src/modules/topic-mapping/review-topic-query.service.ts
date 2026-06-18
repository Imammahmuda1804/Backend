import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type ReviewTopicCount = {
  topicId: number;
  totalReviews: number;
};

export type ReviewTopicSentimentCount = {
  topicId: number;
  sentiment: string | null;
  count: number;
};

export type ReviewTopicAssignment = {
  topicId: number;
  score: number;
  isPrimary: boolean;
  assignmentMethod: string;
};

type ReviewPageInput = {
  topicIds: number[];
  destinationId?: number;
  sentiments?: string[];
  skip: number;
  take: number;
};

type CountRow = {
  topicId: number;
  totalReviews: bigint | number;
};

type SentimentRow = {
  topicId: number;
  sentiment: string | null;
  count: bigint | number;
};

type ReviewPageRow = {
  id: number;
  topicId?: number;
  score?: number | string;
  isPrimary?: boolean;
  assignmentMethod?: string;
  assignments?: unknown;
};

/**
 * Membaca relasi multi-aspek review melalui query SQL yang terpusat.
 *
 * Service lain tidak perlu mengetahui struktur tabel pivot atau menangani
 * nilai bigint yang dikembalikan PostgreSQL.
 */
@Injectable()
export class ReviewTopicQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async getTopicCounts(destinationId: number): Promise<ReviewTopicCount[]> {
    const rows = await this.prisma.$queryRaw<CountRow[]>`
      SELECT
        rt."topic_id" AS "topicId",
        COUNT(*) AS "totalReviews"
      FROM "review_topics" rt
      INNER JOIN "reviews" r ON r."id" = rt."review_id"
      WHERE r."destination_id" = ${destinationId}
      GROUP BY rt."topic_id"
      ORDER BY COUNT(*) DESC, rt."topic_id" ASC
    `;

    return rows.map((row) => ({
      topicId: Number(row.topicId),
      totalReviews: Number(row.totalReviews),
    }));
  }

  async getTopicSentimentCounts(
    destinationId?: number,
  ): Promise<ReviewTopicSentimentCount[]> {
    const destinationFilter =
      destinationId === undefined
        ? Prisma.empty
        : Prisma.sql`AND r."destination_id" = ${destinationId}`;
    const rows = await this.prisma.$queryRaw<SentimentRow[]>(
      Prisma.sql`
        SELECT
          rt."topic_id" AS "topicId",
          r."sentiment",
          COUNT(*) AS "count"
        FROM "review_topics" rt
        INNER JOIN "reviews" r ON r."id" = rt."review_id"
        INNER JOIN "destinations" d ON d."id" = r."destination_id"
        WHERE d."deleted_at" IS NULL
          ${destinationFilter}
        GROUP BY rt."topic_id", r."sentiment"
      `,
    );

    return rows.map((row) => ({
      topicId: Number(row.topicId),
      sentiment: row.sentiment,
      count: Number(row.count),
    }));
  }

  async findReviewPage(input: ReviewPageInput) {
    if (input.topicIds.length === 0) {
      return { reviewIds: [], total: 0, assignmentsByReviewId: new Map() };
    }

    const filters = this.buildReviewFilters(input);
    const [reviewRows, totalRows] = await Promise.all([
      this.prisma.$queryRaw<ReviewPageRow[]>(
        Prisma.sql`
          SELECT
            r."id",
            r."review_date",
            r."created_at",
            COALESCE(
              json_agg(
                json_build_object(
                  'topicId', rt."topic_id",
                  'score', rt."score",
                  'isPrimary', rt."is_primary",
                  'assignmentMethod', rt."assignment_method"
                )
                ORDER BY rt."is_primary" DESC, rt."score" DESC, rt."topic_id" ASC
              ) FILTER (WHERE rt."topic_id" IS NOT NULL),
              '[]'::json
            ) AS "assignments"
          FROM "review_topics" rt
          INNER JOIN "reviews" r ON r."id" = rt."review_id"
          INNER JOIN "destinations" d ON d."id" = r."destination_id"
          WHERE ${filters}
          GROUP BY r."id", r."review_date", r."created_at"
          ORDER BY r."review_date" DESC NULLS LAST, r."created_at" DESC
          OFFSET ${input.skip}
          LIMIT ${input.take}
        `,
      ),
      this.prisma.$queryRaw<Array<{ total: bigint | number }>>(
        Prisma.sql`
          SELECT COUNT(DISTINCT r."id") AS "total"
          FROM "review_topics" rt
          INNER JOIN "reviews" r ON r."id" = rt."review_id"
          INNER JOIN "destinations" d ON d."id" = r."destination_id"
          WHERE ${filters}
        `,
      ),
    ]);

    return {
      reviewIds: reviewRows.map((row) => Number(row.id)),
      total: Number(totalRows[0]?.total ?? 0),
      assignmentsByReviewId: this.mapReviewAssignments(reviewRows),
    };
  }

  async getSentimentSummary(
    topicIds: number[],
    destinationId?: number,
  ): Promise<Array<{ sentiment: string | null; count: number }>> {
    if (topicIds.length === 0) return [];

    const filters = this.buildReviewFilters({
      topicIds,
      destinationId,
    });
    const rows = await this.prisma.$queryRaw<
      Array<{ sentiment: string | null; count: bigint | number }>
    >(
      Prisma.sql`
        SELECT r."sentiment", COUNT(DISTINCT r."id") AS "count"
        FROM "review_topics" rt
        INNER JOIN "reviews" r ON r."id" = rt."review_id"
        INNER JOIN "destinations" d ON d."id" = r."destination_id"
        WHERE ${filters}
        GROUP BY r."sentiment"
      `,
    );

    return rows.map((row) => ({
      sentiment: row.sentiment,
      count: Number(row.count),
    }));
  }

  private mapReviewAssignments(reviewRows: ReviewPageRow[]) {
    return new Map(
      reviewRows.map((row) => [Number(row.id), this.normalizeAssignments(row)]),
    );
  }

  private normalizeAssignments(row: ReviewPageRow): ReviewTopicAssignment[] {
    const rawAssignments = Array.isArray(row.assignments)
      ? row.assignments
      : this.legacyRowToAssignments(row);

    return rawAssignments
      .map((assignment) => this.normalizeAssignment(assignment))
      .filter(
        (assignment): assignment is ReviewTopicAssignment =>
          assignment !== null,
      );
  }

  private legacyRowToAssignments(row: ReviewPageRow) {
    if (row.topicId === undefined) return [];
    return [
      {
        topicId: row.topicId,
        score: row.score,
        isPrimary: row.isPrimary,
        assignmentMethod: row.assignmentMethod,
      },
    ];
  }

  private normalizeAssignment(value: unknown): ReviewTopicAssignment | null {
    if (!value || typeof value !== 'object') return null;
    const assignment = value as Partial<ReviewTopicAssignment>;
    if (assignment.topicId === undefined) return null;

    return {
      topicId: Number(assignment.topicId),
      score: Number(assignment.score ?? 0),
      isPrimary: Boolean(assignment.isPrimary),
      assignmentMethod: String(
        assignment.assignmentMethod || 'aspect_distribution',
      ),
    };
  }

  private buildReviewFilters(input: {
    topicIds: number[];
    destinationId?: number;
    sentiments?: string[];
  }) {
    const filters: Prisma.Sql[] = [
      Prisma.sql`rt."topic_id" IN (${Prisma.join(input.topicIds)})`,
      Prisma.sql`d."deleted_at" IS NULL`,
    ];

    if (input.destinationId !== undefined) {
      filters.push(Prisma.sql`r."destination_id" = ${input.destinationId}`);
    }
    if (input.sentiments && input.sentiments.length > 0) {
      filters.push(
        Prisma.sql`r."sentiment" IN (${Prisma.join(input.sentiments)})`,
      );
    }

    return Prisma.join(filters, ' AND ');
  }
}
