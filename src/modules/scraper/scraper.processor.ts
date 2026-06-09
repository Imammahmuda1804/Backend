import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { ApifyService } from './apify.service';
import type { ScrapedReviewItem } from './scraped-review.types';
import {
  getScrapedReviewRating,
  getScrapedReviewText,
} from './scraped-review.util';
import { ScraperWorkbookService } from './scraper-workbook.service';

interface ScrapingJobData {
  jobId: number;
  destinationId: number;
  url: string;
  maxReviews?: number;
  destinationName?: string;
}

interface ScrapingJobResult {
  status: 'success';
  savedCount: number;
  filePath: string;
}

@Processor('scraping-queue')
export class ScraperProcessor extends WorkerHost {
  private readonly logger = new Logger(ScraperProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly apifyService: ApifyService,
    private readonly workbookService: ScraperWorkbookService,
  ) {
    super();
  }

  async process(
    job: Job<ScrapingJobData, ScrapingJobResult, string>,
  ): Promise<ScrapingJobResult> {
    const { jobId, destinationId, url, maxReviews, destinationName } = job.data;
    this.logJobStart(jobId, destinationId);

    try {
      return await this.processScrapingJob({
        jobId,
        destinationId,
        url,
        maxReviews,
        destinationName,
      });
    } catch (error: unknown) {
      await this.handleScrapingFailure(jobId, error);
      throw error;
    }
  }

  private logJobStart(jobId: number, destinationId: number) {
    this.logger.log(
      `Processing scraping job ${jobId} for destination ${destinationId}`,
    );
  }

  private async processScrapingJob(
    data: ScrapingJobData,
  ): Promise<ScrapingJobResult> {
    await this.markJobRunning(data.jobId);
    await this.fetchAndSaveGoogleRating(data.destinationId, data.url);

    const results = await this.scrapeReviews(data.url, data.maxReviews);
    const finalReviews = this.getTextReviews(results, data.maxReviews);
    this.logFilteredReviewCount(finalReviews.length, data.maxReviews);

    const filePath = await this.workbookService.generate(
      finalReviews,
      data.jobId,
      this.getDestinationNameForFile(data.destinationName),
    );

    await this.completeSuccessfulJob(
      data.jobId,
      data.destinationId,
      finalReviews.length,
    );
    this.logJobSuccess(data.jobId, finalReviews.length, filePath);

    return { status: 'success', savedCount: finalReviews.length, filePath };
  }

  private getDestinationNameForFile(destinationName?: string) {
    return destinationName ?? 'Destination';
  }

  private logFilteredReviewCount(count: number, requested?: number) {
    this.logger.log(
      `Filtered to ${count} text reviews (requested: ${requested ?? 'ALL'})`,
    );
  }

  private logJobSuccess(jobId: number, savedCount: number, filePath: string) {
    this.logger.log(
      `Successfully finished scraping job ${jobId}, generated Excel with ${savedCount} reviews at ${filePath}`,
    );
  }

  private async handleScrapingFailure(jobId: number, error: unknown) {
    const readableError = this.apifyService.toReadableError(error);
    this.logger.error(`Error in scraping job ${jobId}: ${readableError}`, error);
    await this.failJob(jobId, readableError);
  }

  private async markJobRunning(jobId: number) {
    await this.prisma.scrapingJob.update({
      where: { id: jobId },
      data: { status: 'running', startedAt: new Date() },
    });
  }

  private async scrapeReviews(
    mapsUrl: string,
    maxReviews?: number,
  ): Promise<ScrapedReviewItem[]> {
    const oversampledMax = maxReviews ? maxReviews * 3 : undefined;
    const apifyRun = await this.apifyService.startReviewScraping(
      mapsUrl,
      oversampledMax,
    );

    this.logger.log(`Waiting for Apify run ${apifyRun.id} to finish...`);

    const finishedRun = await this.apifyService.waitForRun(apifyRun.id);
    if (finishedRun.status !== 'SUCCEEDED') {
      throw new Error(`Apify run failed with status: ${finishedRun.status}`);
    }

    this.logger.log(
      `Fetching results from dataset ${finishedRun.defaultDatasetId}...`,
    );

    return this.apifyService.getRunResults(finishedRun.defaultDatasetId);
  }

  private getTextReviews(
    results: ScrapedReviewItem[],
    maxReviews?: number,
  ): ScrapedReviewItem[] {
    this.logger.log(
      `Got ${results.length} raw results. Filtering text-only reviews...`,
    );

    const textReviews = results.filter((item) => {
      const reviewText = getScrapedReviewText(item);
      const rating = getScrapedReviewRating(item);
      return reviewText.trim().length > 0 && rating > 0;
    });

    return maxReviews ? textReviews.slice(0, maxReviews) : textReviews;
  }

  private async completeSuccessfulJob(
    jobId: number,
    destinationId: number,
    totalReviews: number,
  ) {
    await this.prisma.scrapingJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        finishedAt: new Date(),
        totalReviews,
      },
    });

    await this.prisma.scrapingHistory.create({
      data: {
        destinationId,
        jobId,
        totalReviews,
        hasText: true,
        sort: 'newest',
      },
    });
  }

  private async failJob(jobId: number, errorMessage: string) {
    await this.prisma.scrapingJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        finishedAt: new Date(),
        errorMessage,
      },
    });
  }

  // Mengambil rating Google Maps jika belum tersedia.
  private async fetchAndSaveGoogleRating(
    destinationId: number,
    mapsUrl: string,
  ) {
    try {
      if (await this.destinationAlreadyHasGoogleRating(destinationId)) return;

      const place = await this.fetchFirstGooglePlace(destinationId, mapsUrl);
      if (place) await this.saveGooglePlaceRating(destinationId, place);
    } catch (err) {
      this.warnGoogleRatingFetchFailed(err);
    }
  }

  private async destinationAlreadyHasGoogleRating(destinationId: number) {
    const destination = await this.prisma.destination.findUnique({
      where: { id: destinationId },
      select: { googleRating: true, googleReviewCount: true },
    });

    if (!this.hasGoogleRating(destination)) return false;

    this.logger.log(
      `Destination ${destinationId} already has Google rating: ${destination.googleRating}`,
    );
    return true;
  }

  private async fetchFirstGooglePlace(destinationId: number, mapsUrl: string) {
    this.logger.log(
      `Fetching Google Maps info for destination ${destinationId}...`,
    );
    const places = await this.apifyService.searchPlaces(mapsUrl);
    return places[0] ?? null;
  }

  private async saveGooglePlaceRating(
    destinationId: number,
    place: { rating?: number | null; totalReviews?: number | null },
  ) {
    await this.prisma.destination.update({
      where: { id: destinationId },
      data: {
        googleRating: place.rating ?? null,
        googleReviewCount: place.totalReviews ?? null,
      },
    });
    this.logger.log(
      `Saved Google Rating: ${place.rating}, Review Count: ${place.totalReviews}`,
    );
  }

  private warnGoogleRatingFetchFailed(err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    this.logger.warn(
      `Failed to fetch Google rating (non-critical): ${errorMessage}`,
    );
  }

  private hasGoogleRating(
    destination: { googleRating: number | null } | null,
  ): destination is { googleRating: number } {
    return (
      destination?.googleRating !== null &&
      destination?.googleRating !== undefined
    );
  }
}
