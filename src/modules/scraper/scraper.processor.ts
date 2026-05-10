import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { ApifyService } from './apify.service';

@Processor('scraping-queue')
export class ScraperProcessor extends WorkerHost {
  private readonly logger = new Logger(ScraperProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly apifyService: ApifyService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const {
      jobId,
      destinationId,
      url,
      maxReviews,
      sort,
      starsFilter,
      hasText,
    } = job.data;

    this.logger.log(
      `Processing scraping job ${jobId} for destination ${destinationId}`,
    );

    await this.prisma.scrapingJob.update({
      where: { id: jobId },
      data: { status: 'running', startedAt: new Date() },
    });

    try {
      const apifyRun = await this.apifyService.startReviewScraping(
        url,
        maxReviews,
        sort,
        starsFilter,
        hasText,
      );

      const runId = apifyRun.id;

      this.logger.log(`Waiting for Apify run ${runId} to finish...`);
      const finishedRun = await this.apifyService.waitForRun(runId);

      const runStatus = finishedRun.status;
      const datasetId = finishedRun.defaultDatasetId;

      if (runStatus !== 'SUCCEEDED') {
        throw new Error(`Apify run failed with status: ${runStatus}`);
      }

      this.logger.log(`Fetching results from dataset ${datasetId}...`);
      const results = await this.apifyService.getRunResults(datasetId);

      this.logger.log(`Saving ${results.length} reviews to database...`);
      let savedCount = 0;

      for (const item of results) {
        const reviewText = (item.text || item.reviewText) as string | null;
        const rating = (item.stars || item.rating) as number | null;
        const reviewerName = (item.name ||
          item.reviewerName ||
          'Anonymous') as string;
        const reviewDateStr = (item.publishedAtDate || item.date) as
          | string
          | null;

        if (!rating) continue;
        if (hasText && !reviewText) continue;

        const reviewDate = reviewDateStr ? new Date(reviewDateStr) : null;

        await this.prisma.review.create({
          data: {
            destinationId,
            reviewerName,
            reviewText,
            rating,
            reviewDate,
            source: 'google_maps',
            likesCount: (item.likesCount as number) || 0,
            ownerReply: (item.responseFromOwnerText as string) || null,
            scrapingJobId: jobId,
          },
        });
        savedCount++;
      }

      await this.prisma.scrapingJob.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          finishedAt: new Date(),
          totalReviews: savedCount,
        },
      });

      await this.prisma.scrapingHistory.create({
        data: {
          destinationId,
          jobId,
          totalReviews: savedCount,
          starsFilter: starsFilter || null,
          hasText: hasText !== undefined ? hasText : null,
          sort: sort || null,
        },
      });

      this.logger.log(`Successfully finished scraping job ${jobId}`);
      return { status: 'success', savedCount };
    } catch (error: unknown) {
      this.logger.error(`Error in scraping job ${jobId}`, error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      await this.prisma.scrapingJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          finishedAt: new Date(),
          errorMessage,
        },
      });

      throw error;
    }
  }
}
