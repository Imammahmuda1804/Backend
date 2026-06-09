import { TopicsService } from './topics.service';
import { RenameTopicDto, RenameTopicGroupDto, UpdateTopicSettingsDto, MergeTopicsDto, TopicGroupPayloadDto } from './dto/topic-admin.dto';
export declare class TopicsController {
    private readonly topicsService;
    constructor(topicsService: TopicsService);
    findAll(scope?: 'search' | 'detail'): Promise<{
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
    renameWithAi(): Promise<{
        total: number;
        renamed: number;
        failed: number;
    }>;
    mergeTopics(dto: MergeTopicsDto): Promise<{
        merged: boolean;
        target_topic_id: number;
        target_topic_name: string;
        source_topic_ids: number[];
        deleted_topics: number;
    }>;
    createGroup(dto: TopicGroupPayloadDto): Promise<{
        topics: never[];
        id: number;
        group_name: string;
        description: string | null;
        keywords: unknown;
        display_order: number;
    }>;
    updateGroup(id: number, dto: TopicGroupPayloadDto): Promise<{
        topics: {
            id: number;
            topic_name: string;
            keywords: import("@prisma/client/runtime/client").JsonValue;
            is_search_visible: boolean;
            is_detail_visible: boolean;
            total_destinations: number;
        }[];
        id: number;
        group_name: string;
        description: string | null;
        keywords: unknown;
        display_order: number;
    }>;
    deleteGroup(id: number): Promise<{
        deleted: boolean;
        id: number;
        group_name: string;
    }>;
    renameGroup(id: number, dto: RenameTopicGroupDto): Promise<{
        id: number;
        group_name: string;
    }>;
    renameTopic(id: number, dto: RenameTopicDto): Promise<{
        merged: boolean;
        target_topic_id: number;
        target_topic_name: string;
        source_topic_ids: number[];
        deleted_topics: number;
    } | {
        id: number;
        topicName: string;
    }>;
    updateSettings(id: number, dto: UpdateTopicSettingsDto): Promise<{
        id: number;
        topic_name: string;
        group_id: number | null;
        is_search_visible: boolean;
        is_detail_visible: boolean;
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
            city: string;
            slug: string;
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
export declare class AdminTopicsController {
    private readonly topicsService;
    constructor(topicsService: TopicsService);
    findReviewsByTopic(id: number, sentiment?: 'positive' | 'neutral' | 'negative', destinationId?: string, page?: string, limit?: string): Promise<{
        topic: {
            id: number;
            topic_name: string;
            group: {
                id: number;
                group_name: string;
            } | null;
        };
        sentiment_summary: {
            positive: number;
            neutral: number;
            negative: number;
            unknown: number;
        };
        data: {
            id: number;
            reviewer_name: string | null;
            review_text: string | null;
            rating: number | null;
            review_date: Date | null;
            sentiment: string | null;
            sentiment_confidence: number | null;
            destination: unknown;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            total_pages: number;
        };
    }>;
}
