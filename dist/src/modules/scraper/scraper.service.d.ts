import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { ApifyService } from './apify.service';
import { StartScrapingDto } from './dto';
export declare class ScraperService {
    private readonly prisma;
    private readonly apifyService;
    private readonly scrapingQueue;
    private readonly logger;
    constructor(prisma: PrismaService, apifyService: ApifyService, scrapingQueue: Queue);
    searchMaps(query: string): Promise<{
        title: string | undefined;
        address: string | undefined;
        rating: number | undefined;
        totalReviews: number | undefined;
        placeId: string | undefined;
        url: string | undefined;
    }[]>;
    startScraping(dto: StartScrapingDto, adminId?: number): Promise<{
        job_id: number;
        status: string;
        destination_name: string;
        maps_url: string;
        message: string;
    }>;
    private findScraperDestination;
    private resolveMapsUrl;
    private resolveMaxReviews;
    private createPendingScrapingJob;
    private enqueueScrapingJob;
    private logQueuedJob;
    private buildStartScrapingResponse;
    getJobStatus(jobId: number): Promise<{
        destination: {
            name: string;
            city: string;
            province: string;
        };
    } & {
        id: number;
        status: string;
        createdAt: Date;
        destinationId: number;
        source: string;
        totalReviews: number | null;
        startedAt: Date | null;
        finishedAt: Date | null;
        errorMessage: string | null;
        createdBy: number | null;
    }>;
    getAllJobs(page: number, limit: number, status?: string): Promise<{
        data: ({
            destination: {
                name: string;
                city: string;
                province: string;
            };
        } & {
            id: number;
            status: string;
            createdAt: Date;
            destinationId: number;
            source: string;
            totalReviews: number | null;
            startedAt: Date | null;
            finishedAt: Date | null;
            errorMessage: string | null;
            createdBy: number | null;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            total_pages: number;
        };
    }>;
    getHistory(page: number, limit: number, destinationId?: number): Promise<{
        data: ({
            destination: {
                name: string;
            };
            job: {
                id: number;
                status: string;
                createdAt: Date;
                destinationId: number;
                source: string;
                totalReviews: number | null;
                startedAt: Date | null;
                finishedAt: Date | null;
                errorMessage: string | null;
                createdBy: number | null;
            };
        } & {
            id: number;
            createdAt: Date;
            destinationId: number;
            totalReviews: number | null;
            jobId: number;
            starsFilter: import("@prisma/client/runtime/client").JsonValue | null;
            hasText: boolean | null;
            sort: string | null;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            total_pages: number;
        };
    }>;
    downloadExcel(jobId: number): Promise<{
        filePath: string;
        filename: string;
    }>;
    private findCompletedScrapingJob;
    private resolveScrapedExcelPath;
    private buildDownloadExcelFileName;
    private toSafeFileName;
    private toDownloadDate;
}
