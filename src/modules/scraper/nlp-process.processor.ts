import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { CsvService } from './csv.service';
import { NlpService } from '../nlp/nlp.service';
import { NlpResultStorageService } from '../nlp/nlp-result-storage.service';

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
      const reviews = await this.prisma.review.findMany({
        where: { scrapingJobId: jobId },
      });

      if (reviews.length === 0) {
        this.logger.log(`No reviews found for job ${jobId}`);
        return { status: 'success', processed: 0 };
      }

      // Format CSV untuk FastAPI dengan kolom yang diharapkan
      const nlpData = reviews.map((r, index) => ({
        index,
        'Teks Ulasan': r.reviewText || '',
        'Nama Pengulas': r.reviewerName || '',
        Rating: r.rating || 0,
        'Tanggal Ulasan': r.reviewDate ? r.reviewDate.toISOString() : '',
        'Jumlah Suka': r.likesCount || 0,
      }));

      const reviewIds = reviews.map((r) => r.id);

      const csvString = this.csvService.generateInternalCsv(nlpData);
      const csvBuffer = Buffer.from(csvString);

      // We call the real FastAPI NLP service
      let nlpResult;
      try {
        nlpResult = await this.nlpService.processPipeline(
          csvBuffer,
          `reviews_job_${jobId}.csv`,
        );

        this.logger.log(
          `✅ FastAPI returned ${nlpResult.results?.length || 0} results`,
        );
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        this.logger.warn(`FastAPI failed: ${errorMessage}`);

        // Fallback hanya aktif di development — di production, lempar error
        if (process.env.NODE_ENV === 'production') {
          throw new Error(
            `NLP processing failed and fallback is disabled in production: ${errorMessage}`,
          );
        }

        this.logger.warn('Using dummy data fallback (development only).');
        // Fallback for development if FastAPI is not up
        // Match the actual FastAPI response format
        const positiveCount = reviews.filter(
          (r) => r.rating && r.rating >= 4,
        ).length;
        const negativeCount = reviews.filter(
          (r) => r.rating && r.rating <= 2,
        ).length;
        const neutralCount = reviews.length - positiveCount - negativeCount;

        nlpResult = {
          summary: {
            total: reviews.length,
            positive: positiveCount,
            negative: negativeCount,
            neutral: neutralCount,
          },
          results: reviews.map((r, i) => ({
            text: r.reviewText || '',
            cleaned_text: r.reviewText?.toLowerCase() || '',
            sentiment:
              r.rating && r.rating >= 4
                ? 'positif'
                : r.rating && r.rating <= 2
                  ? 'negatif'
                  : 'netral',
            topic_id: null,
            // Gunakan index sebagai seed agar embedding tidak identik
            embedding: Array(384)
              .fill(0)
              .map((_, idx) => Math.sin(i * 0.1 + idx * 0.01) * 0.1),
          })),
          topics: [],
        };
      }

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
}
