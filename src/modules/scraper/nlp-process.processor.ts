import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { NlpPipelineResult } from '../nlp/interfaces/nlp-pipeline-result.interface';
import { NlpResultStorageService } from '../nlp/nlp-result-storage.service';
import { NlpService } from '../nlp/nlp.service';
import { CsvService } from './csv.service';

type ScrapedReviewForNlp = {
  id: number;
  reviewText: string | null;
  reviewerName: string | null;
  rating: number | null;
  reviewDate: Date | null;
  likesCount: number | null;
};

type PipelineCsvRow = {
  index: number;
  'Teks Ulasan': string;
  'Nama Pengulas': string;
  Rating: number;
  'Tanggal Ulasan': string;
  'Jumlah Suka': number;
};

@Processor('nlp-queue')
export class NlpProcessProcessor extends WorkerHost {
  private readonly logger = new Logger(NlpProcessProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly csvService: CsvService,
    private readonly nlpService: NlpService,
    private readonly nlpStorageService: NlpResultStorageService,
  ) {
    super();
  }

  async process(
    job: Job<{ jobId: number; destinationId: number }, any, string>,
  ): Promise<any> {
    const { jobId, destinationId } = job.data;
    this.logger.log(
      `Processing NLP for job ${jobId}, destination ${destinationId}`,
    );

    try {
      const reviews = await this.findReviewsForJob(jobId);
      if (reviews.length === 0) return this.emptyResult(jobId);

      const reviewIds = reviews.map((review) => review.id);
      const csvBuffer = this.createPipelineCsvBuffer(reviews);
      const nlpResult = await this.processWithFallback(
        csvBuffer,
        jobId,
        reviews,
      );

      await this.nlpStorageService.saveNlpResults(
        destinationId,
        nlpResult,
        reviewIds,
      );

      this.logger.log(`NLP process completed for job ${jobId}`);
      return { status: 'success', processed: nlpResult.results.length };
    } catch (error: unknown) {
      this.logger.error(`Error processing NLP for job ${jobId}`, error);
      throw error;
    }
  }

  private emptyResult(jobId: number) {
    this.logger.log(`No reviews found for job ${jobId}`);
    return { status: 'success', processed: 0 };
  }

  private findReviewsForJob(jobId: number): Promise<ScrapedReviewForNlp[]> {
    return this.prisma.review.findMany({
      where: { scrapingJobId: jobId },
      select: {
        id: true,
        reviewText: true,
        reviewerName: true,
        rating: true,
        reviewDate: true,
        likesCount: true,
      },
    });
  }

  private createPipelineCsvBuffer(reviews: ScrapedReviewForNlp[]) {
    const nlpData = reviews.map((review, index) =>
      this.toPipelineCsvRow(review, index),
    );

    return Buffer.from(this.csvService.generateInternalCsv(nlpData));
  }

  private toPipelineCsvRow(
    review: ScrapedReviewForNlp,
    index: number,
  ): PipelineCsvRow {
    return {
      index,
      'Teks Ulasan': this.textOrEmpty(review.reviewText),
      'Nama Pengulas': this.textOrEmpty(review.reviewerName),
      Rating: this.numberOrZero(review.rating),
      'Tanggal Ulasan': this.dateToIsoString(review.reviewDate),
      'Jumlah Suka': this.numberOrZero(review.likesCount),
    };
  }

  private textOrEmpty(value: string | null) {
    return value ?? '';
  }

  private numberOrZero(value: number | null) {
    return value ?? 0;
  }

  private dateToIsoString(value: Date | null) {
    return value?.toISOString() ?? '';
  }

  private async processWithFallback(
    csvBuffer: Buffer,
    jobId: number,
    reviews: ScrapedReviewForNlp[],
  ): Promise<NlpPipelineResult> {
    try {
      return await this.processWithFastApi(csvBuffer, jobId);
    } catch (err: unknown) {
      return this.handlePipelineFailure(err, reviews);
    }
  }

  private async processWithFastApi(csvBuffer: Buffer, jobId: number) {
    const nlpResult = await this.nlpService.processPipeline(
      csvBuffer,
      `reviews_job_${jobId}.csv`,
    );

    this.logger.log(
      `FastAPI returned ${nlpResult.results?.length || 0} results`,
    );
    return nlpResult;
  }

  private handlePipelineFailure(
    err: unknown,
    reviews: ScrapedReviewForNlp[],
  ): NlpPipelineResult {
    const errorMessage = err instanceof Error ? err.message : String(err);
    this.logger.warn(`FastAPI failed: ${errorMessage}`);

    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        `NLP processing failed and fallback is disabled in production: ${errorMessage}`,
      );
    }

    this.logger.warn('Using dummy data fallback (development only).');
    return this.createDevelopmentFallbackResult(reviews);
  }

  private createDevelopmentFallbackResult(
    reviews: ScrapedReviewForNlp[],
  ): NlpPipelineResult {
    const summary = this.countFallbackSentiments(reviews);

    return {
      summary: {
        total: reviews.length,
        positive: summary.positive,
        negative: summary.negative,
        neutral: summary.neutral,
      },
      results: reviews.map((review, index) => ({
        text: review.reviewText || '',
        cleaned_text: review.reviewText?.toLowerCase() || '',
        sentiment: this.toFallbackSentiment(review.rating),
        topic_id: null,
        embedding: this.createFallbackEmbedding(index),
      })),
      topics: [],
    };
  }

  private countFallbackSentiments(reviews: ScrapedReviewForNlp[]) {
    const positive = reviews.filter((review) =>
      this.isPositiveRating(review),
    ).length;
    const negative = reviews.filter((review) =>
      this.isNegativeRating(review),
    ).length;

    return {
      positive,
      negative,
      neutral: reviews.length - positive - negative,
    };
  }

  private isPositiveRating(review: ScrapedReviewForNlp) {
    return Boolean(review.rating && review.rating >= 4);
  }

  private isNegativeRating(review: ScrapedReviewForNlp) {
    return Boolean(review.rating && review.rating <= 2);
  }

  private toFallbackSentiment(rating: number | null) {
    return this.getFallbackSentimentBucket(rating ?? 0);
  }

  private getFallbackSentimentBucket(score: number) {
    const bucket = Math.sign(score) * Math.sign(score - 3);
    const labels: Record<number, string> = {
      [-1]: 'negatif',
      0: 'netral',
      1: 'positif',
    };

    return labels[bucket] ?? 'netral';
  }

  private createFallbackEmbedding(seed: number) {
    return Array(384)
      .fill(0)
      .map((_, index) => Math.sin(seed * 0.1 + index * 0.01) * 0.1);
  }
}
