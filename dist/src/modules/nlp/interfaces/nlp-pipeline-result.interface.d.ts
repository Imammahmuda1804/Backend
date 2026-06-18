export interface NlpPipelineResult {
    summary: {
        total: number;
        positive: number;
        negative: number;
        neutral: number;
    };
    results: Array<{
        review_id?: number;
        text: string;
        cleaned_text: string;
        sentiment: string;
        sentiment_confidence?: number;
        topic_id: number | null;
        topic_assignments?: Array<{
            topic_id: number;
            score: number;
            is_primary: boolean;
            assignment_method: 'primary_transform' | 'aspect_distribution' | string;
        }>;
        embedding: number[];
    }>;
    topics: Array<{
        topic_id: number;
        keywords: string[];
        representative_docs?: string[];
    }>;
    new_topics?: Array<{
        topic_id: number;
        keywords: string[];
        representative_docs?: string[];
    }>;
    metadata?: {
        sentiment_model_version?: string;
        topic_model_version?: string;
        topic_trained_at?: string;
        embedding_model_name?: string;
        trained_at?: string;
        dataset?: string;
        split_strategy?: string;
        [key: string]: unknown;
    };
    warning?: string;
}
