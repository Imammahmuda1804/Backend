import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CsvService } from '../scraper/csv.service';
import { NlpService } from './nlp.service';
import type { ProcessReview } from './nlp-upload.types';

type NlpUploadCsvRow = {
  review_id: number;
  'Teks Ulasan': string;
  'Nama Pengulas': string;
  Rating: number;
  'Tanggal Ulasan': string;
  'Jumlah Suka': number;
};

@Injectable()
export class NlpPipelineRunnerService {
  private readonly logger = new Logger(NlpPipelineRunnerService.name);

  constructor(
    private readonly nlpService: NlpService,
    private readonly csvService: CsvService,
  ) {}

  async run(destinationId: number, reviews: ProcessReview[]) {
    const rows = reviews.map((review) => this.toCsvRow(review));
    const csvBuffer = Buffer.from(this.csvService.generateCsv(rows));
    const result = await this.callPipeline(destinationId, csvBuffer);
    this.assertValidResult(result, reviews.length);
    return result;
  }

  private async callPipeline(destinationId: number, csvBuffer: Buffer) {
    try {
      const result = await this.nlpService.processPipeline(
        csvBuffer,
        `reviews_upload_${destinationId}.csv`,
      );
      this.logResultCount(result.results);
      return result;
    } catch (error: unknown) {
      this.logPipelineError(error);
      throw error;
    }
  }

  private toCsvRow(review: ProcessReview): NlpUploadCsvRow {
    return {
      review_id: review.id,
      'Teks Ulasan': this.stringOrEmpty(review.reviewText),
      'Nama Pengulas': this.stringOrEmpty(review.reviewerName),
      Rating: this.numberOrZero(review.rating),
      'Tanggal Ulasan': this.stringOrEmpty(review.reviewDate),
      'Jumlah Suka': this.numberOrZero(review.likesCount),
    };
  }

  private assertValidResult(
    result: {
      results?: Array<{ topic_id?: number | string | null }>;
      topics?: unknown[];
    },
    expectedCount: number,
  ) {
    if (expectedCount === 0) return;
    const reviews = result.results ?? [];
    this.assertReviewsReturned(reviews);
    this.assertTopicsReturned(result.topics, reviews);
  }

  private assertReviewsReturned(reviews: unknown[]) {
    if (reviews.length > 0) return;
    throw new BadRequestException(
      'Model NLP tidak mengembalikan hasil untuk review yang diproses.',
    );
  }

  private assertTopicsReturned(
    topics: unknown[] | undefined,
    reviews: Array<{ topic_id?: number | string | null }>,
  ) {
    const hasTopicList = Boolean(topics?.length);
    const hasMappedTopic = reviews.some(
      (review) => review.topic_id !== null && review.topic_id !== undefined,
    );
    if (!hasTopicList && !hasMappedTopic) {
      throw new BadRequestException(
        'Model NLP tidak mengembalikan topik. Pastikan service Model aktif dan model BERTopic berhasil dimuat.',
      );
    }
  }

  private logResultCount(results?: unknown[]) {
    this.logger.log(`FastAPI returned ${results?.length ?? 0} results`);
  }

  private logPipelineError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    this.logger.warn(`FastAPI failed: ${message}`);
  }

  private stringOrEmpty(value?: string | null) {
    return value ?? '';
  }

  private numberOrZero(value?: number | null) {
    return value ?? 0;
  }
}
