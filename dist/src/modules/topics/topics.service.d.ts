import { PrismaService } from '../../prisma/prisma.service';
import { AiNamingService } from '../nlp/ai-naming.service';
export declare class TopicsService {
    private readonly prisma;
    private readonly aiNamingService;
    private readonly logger;
    constructor(prisma: PrismaService, aiNamingService: AiNamingService);
    renameUnnamedTopics(): Promise<{
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
    findDestinationsByTopic(topicId: number, page: number, limit: number): Promise<{
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
    renameTopic(topicId: number, newName: string): Promise<{
        id: number;
        topicName: string;
    }>;
    deleteTopic(topicId: number): Promise<{
        deleted: boolean;
        id: number;
    }>;
}
