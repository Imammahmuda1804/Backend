import { SearchService } from './search.service';
import { SearchQueryDto } from './dto';
export declare class SearchController {
    private readonly searchService;
    private readonly logger;
    constructor(searchService: SearchService);
    search(dto: SearchQueryDto, req?: any): Promise<import("../vector/interfaces/similar-destination.interface").SimilarDestination[]>;
    getHistory(userId: number, page?: string, limit?: string): Promise<{
        data: {
            id: number;
            createdAt: Date;
            keyword: string;
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
    deleteHistoryEntry(id: number, userId: number): Promise<{
        message: string;
    }>;
}
