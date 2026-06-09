import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { ApifyService } from './apify.service';
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
export declare class ScraperProcessor extends WorkerHost {
    private readonly prisma;
    private readonly apifyService;
    private readonly workbookService;
    private readonly logger;
    constructor(prisma: PrismaService, apifyService: ApifyService, workbookService: ScraperWorkbookService);
    process(job: Job<ScrapingJobData, ScrapingJobResult, string>): Promise<ScrapingJobResult>;
    private logJobStart;
    private processScrapingJob;
    private getDestinationNameForFile;
    private logFilteredReviewCount;
    private logJobSuccess;
    private handleScrapingFailure;
    private getErrorMessage;
    private markJobRunning;
    private scrapeReviews;
    private getTextReviews;
    private completeSuccessfulJob;
    private failJob;
    private fetchAndSaveGoogleRating;
    private destinationAlreadyHasGoogleRating;
    private fetchFirstGooglePlace;
    private saveGooglePlaceRating;
    private warnGoogleRatingFetchFailed;
    private hasGoogleRating;
}
export {};
