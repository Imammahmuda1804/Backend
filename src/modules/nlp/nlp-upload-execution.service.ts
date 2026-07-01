import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import type { ReviewWithHash } from './nlp-upload.types';
import type { NlpProcessingMode } from './utils/nlp-dedup.util';

@Injectable()
export class NlpUploadExecutionService {
  private readonly logger = new Logger(NlpUploadExecutionService.name);

  constructor(
    @InjectQueue('nlp-queue') private readonly nlpQueue: Queue,
  ) {}

  async execute(input: {
    runId: number;
    destinationId: number;
    destinationName: string;
    mode: NlpProcessingMode;
    hashedReviews: ReviewWithHash[];
  }) {
    await this.nlpQueue.add('process-nlp', input);

    this.logger.log(
      `NLP job #${input.runId} enqueued for "${input.destinationName}" (${input.hashedReviews.length} reviews)`,
    );

    return {
      message: 'File berhasil diupload dan NLP processing diantrekan',
      run_id: input.runId,
      status: 'queued',
      mode: input.mode,
      destination_name: input.destinationName,
      total_reviews: input.hashedReviews.length,
    };
  }
}
