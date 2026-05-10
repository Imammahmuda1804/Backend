import { TopicsService } from './topics.service';
export declare class TopicsController {
    private readonly topicsService;
    constructor(topicsService: TopicsService);
    findAll(): Promise<{
        id: number;
        topic_name: string;
        keywords: import("@prisma/client/runtime/client").JsonValue;
        total_destinations: number;
    }[]>;
    findDestinationsByTopic(id: number, page?: string, limit?: string): Promise<{
        data: {
            total_reviews_in_topic: number;
            id: number;
            name: string;
            slug: string;
            city: string;
            province: string;
            thumbnailUrl: string | null;
            positiveRatio: number | null;
            recommendationScore: number | null;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            total_pages: number;
        };
    }>;
}
