import { PrismaService } from '../../prisma/prisma.service';
import { NlpService } from '../nlp/nlp.service';
import { VectorService } from '../vector/vector.service';
import { SearchQueryDto } from './dto';
export declare class SearchService {
    private readonly prisma;
    private readonly nlpService;
    private readonly vectorService;
    private readonly logger;
    constructor(prisma: PrismaService, nlpService: NlpService, vectorService: VectorService);
    semanticSearch(dto: SearchQueryDto, userId?: number): Promise<import("../vector/interfaces/similar-destination.interface").SimilarDestination[]>;
    getHistory(userId: number, page: number, limit: number): Promise<{
        data: {
            id: number;
            keyword: string;
            createdAt: Date;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            total_pages: number;
        };
    }>;
    clearHistory(userId: number): Promise<{
        message: string;
        deleted_count: number;
    }>;
    deleteHistoryEntry(entryId: number, userId: number): Promise<{
        message: string;
    }>;
}
