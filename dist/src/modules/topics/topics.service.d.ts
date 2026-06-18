import { TopicGroupService } from './topic-group.service';
import { TopicManagementService } from './topic-management.service';
import { TopicMergeService } from './topic-merge.service';
import { TopicQueryService } from './topic-query.service';
import { TopicReviewService } from './topic-review.service';
import type { TopicGroupPayload, TopicReviewSentiment, TopicScope } from './topic.types';
export { normalizeTopicNameForMatch } from './topic-name.util';
export declare class TopicsService {
    private readonly queryService;
    private readonly reviewService;
    private readonly mergeService;
    private readonly groupService;
    private readonly managementService;
    constructor(queryService: TopicQueryService, reviewService: TopicReviewService, mergeService: TopicMergeService, groupService: TopicGroupService, managementService: TopicManagementService);
    findAll(scope?: TopicScope, destinationId?: number): Promise<{
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
        selected_destination: {
            id: number;
            name: string;
            city: string;
            slug: string;
        } | null;
        selected_destination_reviews: number;
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
            reviewer_name: string | null;
            review_text: string | null;
            rating: number | null;
            review_date: Date | null;
            sentiment: string | null;
            sentiment_confidence: number | null;
            topic_assignments: {
                topicId: number;
                score: number;
                isPrimary: boolean;
                assignmentMethod: string;
            }[];
            destination: unknown;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            total_pages: number;
        };
    }>;
    renameUnnamedTopics(): Promise<{
        total: number;
        renamed: number;
        failed: number;
    }>;
    renameTopic(topicId: number, newName: string): Promise<{
        merged: boolean;
        target_topic_id: number;
        target_topic_name: string;
        source_topic_ids: number[];
        deleted_topics: number;
    } | {
        id: number;
        topicName: string;
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
        topics: never[];
        id: number;
        group_name: string;
        description: string | null;
        keywords: unknown;
        display_order: number;
    }>;
    updateGroup(groupId: number, data: TopicGroupPayload): Promise<{
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
    deleteGroup(groupId: number): Promise<{
        deleted: boolean;
        id: number;
        group_name: string;
    }>;
    deleteTopic(topicId: number): Promise<{
        deleted: boolean;
        id: number;
    }>;
}
