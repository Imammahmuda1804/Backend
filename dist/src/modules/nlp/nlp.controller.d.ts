import { PrismaService } from '../../prisma/prisma.service';
import { NlpService } from './nlp.service';
import { NlpResultStorageService } from './nlp-result-storage.service';
import { CsvService } from '../scraper/csv.service';
export declare class NlpController {
    private readonly prisma;
    private readonly nlpService;
    private readonly nlpStorageService;
    private readonly csvService;
    private readonly logger;
    constructor(prisma: PrismaService, nlpService: NlpService, nlpStorageService: NlpResultStorageService, csvService: CsvService);
    preflight(file: Express.Multer.File, destinationIdStr: string): Promise<{
        destination_id: number;
        destination_name: string;
        file_name: string;
        file_hash: string;
        total_rows: number;
        new_reviews: number;
        duplicate_reviews: number;
        already_processed: boolean;
        previous_run: {
            id: number;
            status: string;
            startedAt: Date;
            mode: string;
            insertedReviews: number;
            skippedDuplicates: number;
            processedReviews: number;
        } | null;
        recommended_mode: string;
    }>;
    getHistory(destinationId?: string, status?: string, page?: string, limit?: string): Promise<{
        data: ({
            destination: {
                id: number;
                name: string;
                city: string;
            };
            admin: {
                id: number;
                email: string;
                name: string;
            } | null;
        } & {
            id: number;
            status: string;
            createdAt: Date;
            destinationId: number;
            startedAt: Date;
            finishedAt: Date | null;
            errorMessage: string | null;
            adminId: number | null;
            fileName: string;
            fileHash: string;
            mode: string;
            totalRows: number;
            insertedReviews: number;
            skippedDuplicates: number;
            processedReviews: number;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getHistoryDetail(id: string): Promise<{
        destination: {
            id: number;
            name: string;
            city: string;
        };
        admin: {
            id: number;
            email: string;
            name: string;
        } | null;
    } & {
        id: number;
        status: string;
        createdAt: Date;
        destinationId: number;
        startedAt: Date;
        finishedAt: Date | null;
        errorMessage: string | null;
        adminId: number | null;
        fileName: string;
        fileHash: string;
        mode: string;
        totalRows: number;
        insertedReviews: number;
        skippedDuplicates: number;
        processedReviews: number;
    }>;
    uploadAndProcess(file: Express.Multer.File, destinationIdStr: string, rawMode: string | undefined, adminId?: number): Promise<{
        message: string;
        run_id: number;
        mode: import("./utils/nlp-dedup.util").NlpProcessingMode;
        destination_name: string;
        total_reviews_processed: number;
        inserted_reviews: number;
        skipped_duplicates: number;
        scraped_average_rating: number | null;
        nlp_summary: {
            total: number;
            positive: number;
            negative: number;
            neutral: number;
        };
    }>;
    private parseDestinationId;
    private getDestinationOrThrow;
    private parseFileOrThrow;
    private getExistingReviewHashes;
    private getExistingReviewMap;
    private runPipeline;
    private assertValidPipelineResult;
    private resetDestinationNlpData;
    private refreshDestinationRating;
    private getSentimentSummary;
    private cleanupInsertedReviews;
}
