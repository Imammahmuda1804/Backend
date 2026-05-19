import type { Request, Response } from 'express';
import { ScraperService } from './scraper.service';
import { SearchQueryDto, StartScrapingDto, JobQueryDto, HistoryQueryDto } from './dto';
type AuthenticatedRequest = Request & {
    user?: {
        id: number;
        email: string;
        role: string;
    };
};
export declare class ScraperController {
    private readonly scraperService;
    constructor(scraperService: ScraperService);
    searchMaps(query: SearchQueryDto): Promise<{
        title: string | undefined;
        address: string | undefined;
        rating: number | undefined;
        totalReviews: number | undefined;
        placeId: string | undefined;
        url: string | undefined;
    }[]>;
    startScraping(dto: StartScrapingDto, req: AuthenticatedRequest): Promise<{
        job_id: number;
        status: string;
        destination_name: string;
        maps_url: string;
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
    getJobs(query: JobQueryDto): Promise<{
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
    getHistory(query: HistoryQueryDto): Promise<{
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
            jobId: number;
            starsFilter: import("@prisma/client/runtime/client").JsonValue | null;
            hasText: boolean | null;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            total_pages: number;
        };
    }>;
    downloadExcel(jobId: number, res: Response): Promise<void>;
}
export {};
