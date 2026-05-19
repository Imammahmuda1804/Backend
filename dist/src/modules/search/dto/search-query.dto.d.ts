export declare class SearchQueryDto {
    query: string;
    limit?: number;
    sort?: 'relevance' | 'hybrid';
    city?: string;
    topic_ids?: number[];
    topicIds?: number[];
    min_rating?: number;
    minRating?: number;
    sentiment?: 'positive' | 'negative' | 'neutral';
}
