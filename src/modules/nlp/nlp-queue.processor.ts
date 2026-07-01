import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { NlpReviewDedupService } from './nlp-review-dedup.service';
import { NlpPipelineRunnerService } from './nlp-pipeline-runner.service';
import { NlpResultStorageService } from './nlp-result-storage.service';
import { NlpProcessingHistoryService } from './nlp-processing-history.service';
import type { ReviewWithHash } from './nlp-upload.types';
import type { NlpProcessingMode } from './utils/nlp-dedup.util';

type NlpQueueJob = {
  runId: number;
  destinationId: number;
  destinationName: string;
  mode: NlpProcessingMode;
  hashedReviews: ReviewWithHash[];
};

@Processor('nlp-queue')
export class NlpQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(NlpQueueProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dedupService: NlpReviewDedupService,
    private readonly pipelineRunner: NlpPipelineRunnerService,
    private readonly resultStorage: NlpResultStorageService,
    private readonly history: NlpProcessingHistoryService,
  ) {
    super();
  }

  async process(job: Job<NlpQueueJob>) {
    const { runId, destinationId, mode, hashedReviews } = job.data;
    const insertedReviewIds: number[] = [];

    try {
      await this.prisma.nlpProcessingRun.update({
        where: { id: runId },
        data: { status: 'processing' },
      });

      if (mode === 'replace_existing') {
        await this.resetDestinationNlpData(destinationId);
      }

      const plan = await this.dedupService.prepareReviewProcessingPlan(
        destinationId,
        mode,
        hashedReviews,
        insertedReviewIds,
      );

      if (plan.processReviews.length > 0) {
        const result = await this.pipelineRunner.run(
          destinationId,
          plan.processReviews,
        );
        await this.resultStorage.saveNlpResults(
          destinationId,
          result,
          plan.processReviews.map((r) => r.id),
        );
      }

      await this.history.markCompleted(runId, plan);
      this.logger.log(
        `NLP queue job #${job.id} done — ${plan.processReviews.length} reviews processed`,
      );
      return { status: 'success', processed: plan.processReviews.length };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`NLP queue job #${job.id} failed: ${message}`);

      if (mode !== 'replace_existing') {
        await this.cleanupInsertedReviews(insertedReviewIds);
      }
      await this.history.markFailed(runId, message, insertedReviewIds.length);
    }
  }

  private async resetDestinationNlpData(destinationId: number) {
    await this.prisma.review.deleteMany({
      where: { destinationId, source: 'google_maps' },
    });
    await this.prisma.destinationTopic.deleteMany({
      where: { destinationId },
    });
    await this.prisma.sentimentTrend.deleteMany({
      where: { destinationId },
    });
  }

  private async cleanupInsertedReviews(reviewIds: number[]) {
    if (reviewIds.length === 0) return;
    try {
      await this.prisma.review.deleteMany({
        where: { id: { in: reviewIds } },
      });
    } catch (error: unknown) {
      this.logger.error(
        `Rollback cleanup failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
