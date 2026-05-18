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
        topic_id: number | null;
        embedding: number[];
    }>;
    topics: Array<{
        topic_id: number;
        keywords: string[];
    }>;
    new_topics?: Array<{
        topic_id: number;
        keywords: string[];
    }>;
    warning?: string;
}
