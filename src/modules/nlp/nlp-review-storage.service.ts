import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
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
};

@Injectable()
export class NlpReviewStorageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vectorService: VectorService,
  ) {}

  async save(
    destinationId: number,
    nlpResult: NlpPipelineResult,
    reviewIds: number[],
    savedTopicIds: Map<number, number>,
  ) {
    await this.updateReviews(nlpResult, reviewIds, savedTopicIds);
    await this.saveReviewEmbeddings(nlpResult, reviewIds);
    await this.saveDestinationEmbedding(destinationId, nlpResult);
  }
  // Memperbarui review dengan teks bersih, sentimen, confidence, dan topik.
  private async updateReviews(
    nlpResult: NlpPipelineResult,
    reviewIds: number[],
    savedTopicIds: Map<number, number>,
  ): Promise<void> {
    const updates = this.buildReviewUpdates(
      nlpResult,
      reviewIds,
      savedTopicIds,
    );

    for (const update of updates) {
      await this.prisma.review.update({
        where: { id: update.reviewId },
        data: {
          cleanedText: update.cleanedText,
          sentiment: update.sentiment,
          sentimentConfidence: update.sentimentConfidence,
          topicId: update.topicId,
        },
      });
    }
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

    return {
      reviewId,
      cleanedText: review.cleaned_text,
      sentiment: mapPipelineSentiment(review.sentiment),
      sentimentConfidence: review.sentiment_confidence,
      topicId: this.resolveSavedTopicId(review.topic_id, savedTopicIds),
    };
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
