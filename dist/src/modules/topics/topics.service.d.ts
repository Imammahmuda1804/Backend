import { PrismaService } from '../../prisma/prisma.service';
export declare class TopicsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
}
