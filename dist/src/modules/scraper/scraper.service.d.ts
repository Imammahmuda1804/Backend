import { PrismaService } from '../../prisma/prisma.service';
import { ApifyService } from './apify.service';
import { CsvService } from './csv.service';
import { Queue } from 'bullmq';
import { StartScrapingDto } from './dto';
export declare class ScraperService {
    private readonly prisma;
    private readonly apifyService;
    private readonly csvService;
    private readonly scrapingQueue;
    private readonly nlpQueue;
    private readonly logger;
    constructor(prisma: PrismaService, apifyService: ApifyService, csvService: CsvService, scrapingQueue: Queue, nlpQueue: Queue);
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
        message: string;
    }>;
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
            sort: string | null;
            destinationId: number;
            totalReviews: number | null;
            starsFilter: import("@prisma/client/runtime/client").JsonValue | null;
            hasText: boolean | null;
            jobId: number;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            total_pages: number;
        };
    }>;
    downloadCsv(jobId: number): Promise<string>;
    processNlp(jobId: number): Promise<{
        message: string;
        job_id: number;
    }>;
}
