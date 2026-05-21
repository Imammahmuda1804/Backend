import { PrismaService } from '../../prisma/prisma.service';
import { AiNamingService } from '../nlp/ai-naming.service';
type TopicScope = 'search' | 'detail';
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
    findAll(scope?: TopicScope): Promise<{
        id: number;
        group_name: string;
        description: string | null;
        keywords: import("@prisma/client/runtime/client").JsonValue;
        display_order: number;
        topics: {
            id: number;
            topic_name: string;
            keywords: import("@prisma/client/runtime/client").JsonValue;
            is_search_visible: boolean;
            is_detail_visible: boolean;
            total_destinations: number;
        }[];
    }[] | {
        id: number;
        topic_name: string;
        keywords: import("@prisma/client/runtime/client").JsonValue;
        label_type: string;
        is_search_visible: boolean;
        is_detail_visible: boolean;
        group_id: number | null;
        group_name: string | null;
        group: {
            id: number;
            group_name: string;
        } | null;
        total_destinations: number;
    }[]>;
    findGroups(): Promise<{
        id: number;
        group_name: string;
        description: string | null;
        keywords: import("@prisma/client/runtime/client").JsonValue;
        display_order: number;
        topics: {
            id: number;
            topic_name: string;
            keywords: import("@prisma/client/runtime/client").JsonValue;
            is_search_visible: boolean;
            is_detail_visible: boolean;
            total_destinations: number;
        }[];
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
    updateTopicSettings(topicId: number, data: {
        groupId?: number | null;
        isSearchVisible?: boolean;
        isDetailVisible?: boolean;
    }): Promise<{
        id: number;
        topic_name: string;
        group_id: number | null;
        is_search_visible: boolean;
        is_detail_visible: boolean;
    }>;
    renameGroup(groupId: number, groupName: string): Promise<{
        id: number;
        group_name: string;
    }>;
    deleteTopic(topicId: number): Promise<{
        deleted: boolean;
        id: number;
    }>;
}
export {};
