import { TopicsService } from './topics.service';
import { RenameTopicDto, RenameTopicGroupDto, UpdateTopicSettingsDto } from './dto/topic-admin.dto';
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
        renamed: number;
        failed: number;
        total: number;
    }>;
    renameGroup(id: number, dto: RenameTopicGroupDto): Promise<{
        id: number;
        group_name: string;
    }>;
    renameTopic(id: number, dto: RenameTopicDto): Promise<{
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
