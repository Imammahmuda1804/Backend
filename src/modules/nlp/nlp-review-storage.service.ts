import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CanonicalReviewTopicAssignment,
  ReviewTopicPersistenceService,
} from '../topic-mapping/review-topic-persistence.service';
import { VectorService } from '../vector/vector.service';
import { NlpPipelineResult } from './interfaces/nlp-pipeline-result.interface';
import {
  averageAndNormalizeEmbeddings,
  mapPipelineSentiment,
} from './utils/nlp-result.util';

type ReviewUpdatePayload = {
  reviewId: number;
  cleanedText: string;
  sentiment: string;
  sentimentConfidence?: number;
  topicId: number | null;
  topicAssignments: ReviewTopicAssignmentPayload[];
};

type ReviewTopicAssignmentPayload = CanonicalReviewTopicAssignment;

@Injectable()
export class NlpReviewStorageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vectorService: VectorService,
    private readonly reviewTopicPersistence: ReviewTopicPersistenceService,
  ) {}

  async save(
    destinationId: number,
    nlpResult: NlpPipelineResult,
    reviewIds: number[],
    savedTopicIds: Map<number, number>,
  ) {
    await this.updateReviewsAndTopics(nlpResult, reviewIds, savedTopicIds);
    await this.saveReviewEmbeddings(nlpResult, reviewIds);
    await this.saveDestinationEmbedding(destinationId, nlpResult);
  }
  // Memperbarui review dengan teks bersih, sentimen, confidence, dan topik.
  private async updateReviewsAndTopics(
    nlpResult: NlpPipelineResult,
    reviewIds: number[],
    savedTopicIds: Map<number, number>,
  ): Promise<void> {
    const updates = this.buildReviewUpdates(
      nlpResult,
      reviewIds,
      savedTopicIds,
    );

    await this.prisma.$transaction(async (transaction) => {
      for (const update of updates) {
        await this.saveReviewUpdate(transaction, update);
      }
    });
  }

  private async saveReviewUpdate(
    transaction: Prisma.TransactionClient,
    update: ReviewUpdatePayload,
  ) {
    await transaction.review.update({
      where: { id: update.reviewId },
      data: {
        cleanedText: update.cleanedText,
        sentiment: update.sentiment,
        sentimentConfidence: update.sentimentConfidence,
        topicId: update.topicId,
      },
    });
    await this.reviewTopicPersistence.replaceAssignments(
      transaction,
      update.reviewId,
      update.topicAssignments,
    );
  }

  private buildReviewUpdates(
    nlpResult: NlpPipelineResult,
    reviewIds: number[],
    savedTopicIds: Map<number, number>,
  ): ReviewUpdatePayload[] {
    if (!Array.isArray(nlpResult.results)) return [];

    return nlpResult.results
      .map((review, index) =>
        this.toReviewUpdate(review, reviewIds[index], savedTopicIds),
      )
      .filter((update): update is ReviewUpdatePayload => update !== null);
  }

  private toReviewUpdate(
    review: NlpPipelineResult['results'][number],
    fallbackReviewId: number | undefined,
    savedTopicIds: Map<number, number>,
  ): ReviewUpdatePayload | null {
    const reviewId = review.review_id ?? fallbackReviewId;
    if (!reviewId) return null;

    const topicId = this.resolveSavedTopicId(review.topic_id, savedTopicIds);

    return {
      reviewId,
      cleanedText: review.cleaned_text,
      sentiment: mapPipelineSentiment(review.sentiment),
      sentimentConfidence: review.sentiment_confidence,
      topicId,
      topicAssignments: this.resolveTopicAssignments(
        review,
        topicId,
        savedTopicIds,
      ),
    };
  }

  private resolveTopicAssignments(
    review: NlpPipelineResult['results'][number],
    primaryTopicId: number | null,
    savedTopicIds: Map<number, number>,
  ): ReviewTopicAssignmentPayload[] {
    const sourceAssignments =
      review.topic_assignments && review.topic_assignments.length > 0
        ? review.topic_assignments
        : this.buildLegacyPrimaryAssignment(review.topic_id);
    const canonicalAssignments = new Map<
      number,
      ReviewTopicAssignmentPayload
    >();

    for (const assignment of sourceAssignments) {
      const topicId = this.resolveSavedTopicId(
        assignment.topic_id,
        savedTopicIds,
      );
      if (topicId === null) continue;

      const existing = canonicalAssignments.get(topicId);
      canonicalAssignments.set(topicId, {
        topicId,
        score: Math.max(existing?.score ?? 0, assignment.score),
        isPrimary:
          topicId === primaryTopicId ||
          Boolean(existing?.isPrimary) ||
          assignment.is_primary,
        assignmentMethod:
          topicId === primaryTopicId
            ? 'primary_transform'
            : (existing?.assignmentMethod ?? assignment.assignment_method),
      });
    }

    return Array.from(canonicalAssignments.values()).map((assignment) => ({
      ...assignment,
      isPrimary: assignment.topicId === primaryTopicId,
    }));
  }

  private buildLegacyPrimaryAssignment(topicId: number | null | undefined) {
    return topicId == null
      ? []
      : [
          {
            topic_id: topicId,
            score: 1,
            is_primary: true,
            assignment_method: 'legacy_primary',
          },
        ];
  }

  private resolveSavedTopicId(
    topicId: number | null | undefined,
    savedTopicIds: Map<number, number>,
  ) {
    return topicId != null ? (savedTopicIds.get(topicId) ?? null) : null;
  }

  // Menyimpan embedding setiap review ke tabel pgvector.
  private async saveReviewEmbeddings(
    nlpResult: NlpPipelineResult,
    reviewIds: number[],
  ): Promise<void> {
    const embeddingsToInsert = (nlpResult.results || [])
      .filter((result) => result.embedding && result.embedding.length > 0)
      .map((result, index) => ({
        reviewId: result.review_id ?? reviewIds[index],
        embedding: result.embedding,
      }))
      .filter((item): item is { reviewId: number; embedding: number[] } =>
        Boolean(item.reviewId),
      );

    if (embeddingsToInsert.length > 0) {
      await this.vectorService.batchInsertReviewEmbeddings(embeddingsToInsert);
    }
  }

  // Membuat embedding destinasi dari rata-rata embedding review.
  private async saveDestinationEmbedding(
    destinationId: number,
    nlpResult: NlpPipelineResult,
  ): Promise<void> {
    const validEmbeddings = (nlpResult.results || [])
      .map((result) => result.embedding)
      .filter((embedding) => embedding && embedding.length > 0);

    const destinationEmbedding = averageAndNormalizeEmbeddings(validEmbeddings);

    if (destinationEmbedding) {
      await this.vectorService.upsertDestinationEmbedding(
        destinationId,
        destinationEmbedding,
      );
    }
  }
}
