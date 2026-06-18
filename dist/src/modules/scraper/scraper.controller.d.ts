import type { Response } from 'express';
import { ScraperService } from './scraper.service';
import { HistoryQueryDto, JobQueryDto, ScraperOverviewQueryDto, SearchQueryDto, StartScrapingDto } from './dto';
type AdminUser = {
    id: number;
    email: string;
    role: string;
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
    getOverview(query: ScraperOverviewQueryDto): Promise<{
        destination_id: number;
        destination_name: string;
        maps_url: string;
        live_google: {
            title: string | null;
            address: string | null;
            rating: number | null;
            total_reviews: number | null;
            place_id: string | null;
            fetched_at: string;
        };
        cached_destination: {
            google_rating: number | null;
            google_review_count: number | null;
        };
        database: {
            stored_text_reviews: number;
            processed_reviews: number;
            latest_nlp_run: {
                id: number;
                status: string;
                startedAt: Date;
                finishedAt: Date | null;
                fileName: string;
                mode: string;
                totalRows: number;
                insertedReviews: number;
                skippedDuplicates: number;
                processedReviews: number;
            } | null;
            latest_scraping_job: {
                id: number;
                status: string;
                createdAt: Date;
                totalReviews: number | null;
                startedAt: Date | null;
                finishedAt: Date | null;
            } | null;
        };
        coverage: {
            stored_text_reviews_percent: number | null;
            processed_reviews_percent: number | null;
        };
        text_filter_note: string;
    }>;
    startScraping(dto: StartScrapingDto, user?: AdminUser): Promise<{
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
    downloadExcel(jobId: number, res: Response): Promise<void>;
}
export {};
