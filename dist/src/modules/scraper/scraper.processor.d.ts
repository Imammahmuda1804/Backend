import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { ApifyService } from './apify.service';
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
    private readonly logger;
    constructor(prisma: PrismaService, apifyService: ApifyService);
    process(job: Job<ScrapingJobData, ScrapingJobResult, string>): Promise<ScrapingJobResult>;
    private fetchAndSaveGoogleRating;
    private generateExcel;
}
export {};
