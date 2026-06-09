import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NlpPipelineRunnerService } from './nlp-pipeline-runner.service';
import { NlpProcessingHistoryService } from './nlp-processing-history.service';
import { NlpResultStorageService } from './nlp-result-storage.service';
import { NlpReviewDedupService } from './nlp-review-dedup.service';
import type { ReviewWithHash } from './nlp-upload.types';
import type { NlpProcessingMode } from './utils/nlp-dedup.util';

@Injectable()
export class NlpUploadExecutionService {
  private readonly logger = new Logger(NlpUploadExecutionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dedupService: NlpReviewDedupService,
    private readonly pipelineRunner: NlpPipelineRunnerService,
    private readonly resultStorage: NlpResultStorageService,
    private readonly history: NlpProcessingHistoryService,
  ) {}

  async execute(input: {
    runId: number;
    destinationId: number;
    destinationName: string;
    mode: NlpProcessingMode;
    hashedReviews: ReviewWithHash[];
  }) {
    const insertedReviewIds: number[] = [];

    try {
      if (input.mode === 'replace_existing') {
        await this.resetDestinationNlpData(input.destinationId);
      }

      const plan = await this.dedupService.prepareReviewProcessingPlan(
        input.destinationId,
        input.mode,
        input.hashedReviews,
        insertedReviewIds,
      );
      await this.processReviews(input.destinationId, plan.processReviews);
      const rating = await this.refreshDestinationRating(input.destinationId);
      await this.history.markCompleted(input.runId, plan);

      this.logger.log(
        `NLP processing completed for destination "${input.destinationName}"`,
      );
      return {
        message: 'File berhasil diupload dan NLP processing selesai',
        run_id: input.runId,
        mode: input.mode,
        destination_name: input.destinationName,
        total_reviews_processed: plan.processReviews.length,
        inserted_reviews: plan.insertedReviewIds.length,
        skipped_duplicates: plan.skippedDuplicates,
        scraped_average_rating: rating._avg.rating
          ? parseFloat(rating._avg.rating.toFixed(2))
          : null,
        nlp_summary: await this.getSentimentSummary(input.destinationId),
      };
    } catch (error: unknown) {
      await this.handleFailure(input, insertedReviewIds, error);
    }
  }

  private async processReviews(
    destinationId: number,
    reviews: Parameters<NlpPipelineRunnerService['run']>[1],
  ) {
    if (reviews.length === 0) return;
    const result = await this.pipelineRunner.run(destinationId, reviews);
    await this.resultStorage.saveNlpResults(
      destinationId,
      result,
      reviews.map((review) => review.id),
    );
  }

  private async handleFailure(
    input: {
      runId: number;
      destinationId: number;
      mode: NlpProcessingMode;
    },
    insertedReviewIds: number[],
    error: unknown,
  ): Promise<never> {
    const message = error instanceof Error ? error.message : String(error);
    this.logger.error(`NLP processing failed: ${message}`);

    if (input.mode !== 'replace_existing') {
      await this.cleanupInsertedReviews(input.destinationId, insertedReviewIds);
    }
    await this.history.markFailed(
      input.runId,
      message,
      insertedReviewIds.length,
    );
    throw new BadRequestException(`NLP processing gagal: ${message}`);
  }

  private async resetDestinationNlpData(destinationId: number) {
    await this.prisma.review.deleteMany({
      where: { destinationId, source: 'google_maps' },
    });
    await this.prisma.destinationTopic.deleteMany({ where: { destinationId } });
    await this.prisma.sentimentTrend.deleteMany({ where: { destinationId } });
  }

  private async refreshDestinationRating(destinationId: number) {
    const rating = await this.prisma.review.aggregate({
      where: { destinationId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await this.prisma.destination.update({
      where: { id: destinationId },
      data: {
        googleRating: rating._avg.rating
          ? parseFloat(rating._avg.rating.toFixed(2))
          : null,
        googleReviewCount: rating._count.rating,
      },
    });
    return rating;
  }

  private async getSentimentSummary(destinationId: number) {
    const grouped = await this.prisma.review.groupBy({
      by: ['sentiment'],
      where: { destinationId, sentiment: { not: null } },
      _count: { _all: true },
    });
    const summary = { total: 0, positive: 0, negative: 0, neutral: 0 };

    for (const item of grouped) {
      const count = item._count._all;
      summary.total += count;
      if (item.sentiment === 'positive') summary.positive += count;
      else if (item.sentiment === 'negative') summary.negative += count;
      else summary.neutral += count;
    }
    return summary;
  }

  private async cleanupInsertedReviews(
    destinationId: number,
    reviewIds: number[],
  ) {
    if (reviewIds.length === 0) return;

    try {
      await this.prisma.review.deleteMany({
        where: { id: { in: reviewIds } },
      });
      await this.refreshDestinationRating(destinationId);
      this.logger.warn(
        `Rolled back ${reviewIds.length} inserted reviews after NLP failure`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to rollback NLP upload reviews: ${message}`);
    }
  }
}
