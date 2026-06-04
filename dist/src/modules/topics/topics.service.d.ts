import { PrismaService } from '../../prisma/prisma.service';
import { AiNamingService } from '../nlp/ai-naming.service';
type TopicScope = 'search' | 'detail';
type TopicGroupPayload = {
    groupName: string;
    description?: string;
    keywords?: string[];
    displayOrder?: number;
};
type TopicReviewSentiment = 'positive' | 'neutral' | 'negative';
export declare function normalizeTopicNameForMatch(value: string): string;
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
    findReviewsByTopic(topicId: number, page: number, limit: number, sentiment?: TopicReviewSentiment, destinationId?: number): Promise<{
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
            reviewer_name: string;
            review_text: string | null;
            rating: number | null;
            review_date: Date | null;
            sentiment: string | null;
            sentiment_confidence: number | null;
            destination: {
                id: number;
                name: string;
                city: string;
                slug: string;
                province: string;
                thumbnailUrl: string | null;
            };
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
    } | {
        merged: boolean;
        target_topic_id: number;
        target_topic_name: string;
        source_topic_ids: number[];
        deleted_topics: number;
    }>;
    findTopicByNormalizedName(topicName: string, excludeId?: number): Promise<{
        id: number;
        topicName: string;
    } | null>;
    mergeTopics(targetTopicId: number, sourceTopicIds: number[]): Promise<{
        merged: boolean;
        target_topic_id: number;
        target_topic_name: string;
        source_topic_ids: number[];
        deleted_topics: number;
    }>;
    private mergeTopicKeywords;
    private mapSentimentFilter;
    private normalizeSentimentSummary;
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
    createGroup(data: TopicGroupPayload): Promise<{
        id: number;
        group_name: string;
        description: string | null;
        keywords: import("@prisma/client/runtime/client").JsonValue;
        display_order: number;
        topics: never[];
    }>;
    updateGroup(groupId: number, data: TopicGroupPayload): Promise<{
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
    }>;
    deleteGroup(groupId: number): Promise<{
        deleted: boolean;
        id: number;
        group_name: string;
    }>;
    private normalizeKeywords;
    deleteTopic(topicId: number): Promise<{
        deleted: boolean;
        id: number;
    }>;
}
export {};
