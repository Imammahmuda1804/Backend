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
    uploadAndProcess(file: Express.Multer.File, destinationIdStr: string): Promise<{
        message: string;
        destination_name: string;
        total_reviews_processed: number;
        scraped_average_rating: number | null;
        nlp_summary: {
            total: number;
            positive: number;
            negative: number;
            neutral: number;
        } | {
            total: number;
            positive: number;
            negative: number;
            neutral: number;
        };
    }>;
    private cleanupInsertedReviews;
}
