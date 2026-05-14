export declare class ReviewsQueryDto {
    page?: number;
    limit?: number;
    sentiment?: string;
    topic_id?: number;
    date_from?: string;
    date_to?: string;
    sort_by?: 'newest' | 'oldest';
    nlp_status?: 'all' | 'processed' | 'unprocessed';
}
