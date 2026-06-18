import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export type CanonicalReviewTopicAssignment = {
  topicId: number;
  score: number;
  isPrimary: boolean;
  assignmentMethod: string;
};

type ReviewTopicTransaction = Pick<Prisma.TransactionClient, '$executeRaw'>;

/**
 * Menyimpan relasi multi-aspek review dengan SQL terisolasi.
 *
 * Raw SQL dipakai agar migration dapat diterapkan sebelum Prisma Client lokal
 * diregenerate, sementara seluruh pemanggil tetap memakai transaction Prisma.
 */
@Injectable()
export class ReviewTopicPersistenceService {
  async replaceAssignments(
    transaction: ReviewTopicTransaction,
    reviewId: number,
    assignments: CanonicalReviewTopicAssignment[],
  ) {
    await transaction.$executeRaw`
      DELETE FROM "review_topics"
      WHERE "review_id" = ${reviewId}
    `;

    if (assignments.length === 0) return;

    const rows = assignments.map(
      (assignment) => Prisma.sql`
        (
          ${reviewId},
          ${assignment.topicId},
          ${assignment.score},
          ${assignment.isPrimary},
          ${assignment.assignmentMethod}
        )
      `,
    );

    await transaction.$executeRaw(
      Prisma.sql`
        INSERT INTO "review_topics" (
          "review_id",
          "topic_id",
          "score",
          "is_primary",
          "assignment_method"
        )
        VALUES ${Prisma.join(rows)}
        ON CONFLICT ("review_id", "topic_id")
        DO UPDATE SET
          "score" = EXCLUDED."score",
          "is_primary" = EXCLUDED."is_primary",
          "assignment_method" = EXCLUDED."assignment_method",
          "updated_at" = CURRENT_TIMESTAMP
      `,
    );
  }

  async moveAssignments(
    transaction: ReviewTopicTransaction,
    targetTopicId: number,
    sourceTopicIds: number[],
  ) {
    if (sourceTopicIds.length === 0) return;

    await transaction.$executeRaw(
      Prisma.sql`
        INSERT INTO "review_topics" (
          "review_id",
          "topic_id",
          "score",
          "is_primary",
          "assignment_method"
        )
        SELECT
          "review_id",
          ${targetTopicId},
          "score",
          "is_primary",
          CASE
            WHEN "is_primary" THEN 'primary_transform'
            ELSE "assignment_method"
          END
        FROM "review_topics"
        WHERE "topic_id" IN (${Prisma.join(sourceTopicIds)})
        ON CONFLICT ("review_id", "topic_id")
        DO UPDATE SET
          "score" = GREATEST(
            "review_topics"."score",
            EXCLUDED."score"
          ),
          "is_primary" = (
            "review_topics"."is_primary"
            OR EXCLUDED."is_primary"
          ),
          "assignment_method" = CASE
            WHEN (
              "review_topics"."is_primary"
              OR EXCLUDED."is_primary"
            ) THEN 'primary_transform'
            ELSE "review_topics"."assignment_method"
          END,
          "updated_at" = CURRENT_TIMESTAMP
      `,
    );

    await transaction.$executeRaw(
      Prisma.sql`
        DELETE FROM "review_topics"
        WHERE "topic_id" IN (${Prisma.join(sourceTopicIds)})
      `,
    );
  }
}
