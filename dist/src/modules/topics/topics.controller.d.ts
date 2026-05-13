import { TopicsService } from './topics.service';
export declare class TopicsController {
    private readonly topicsService;
    constructor(topicsService: TopicsService);
    renameTopics(): Promise<{
        renamed: number;
        failed: number;
        total: number;
    }>;
    findAll(): Promise<{
        id: number;
        topic_name: string;
        keywords: import("@prisma/client/runtime/client").JsonValue;
        total_destinations: number;
    }[]>;
    renameTopic(id: number, topicName: string): Promise<{
        id: number;
        topicName: string;
    }>;
    deleteTopic(id: number): Promise<{
        deleted: boolean;
        id: number;
    }>;
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
