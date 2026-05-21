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
    sentiment: string; // "positif", "negatif", "netral"
    sentiment_confidence?: number;
    topic_id: number | null;
    embedding: number[];
  }>;
  topics: Array<{
    topic_id: number;
    keywords: string[];
    representative_docs?: string[];
  }>;
  // Topik baru dari pipeline NLP.
  new_topics?: Array<{
    topic_id: number;
    keywords: string[];
    representative_docs?: string[];
  }>;
  metadata?: {
    sentiment_model_version?: string;
    topic_model_version?: string;
    embedding_model_name?: string;
    trained_at?: string;
    dataset?: string;
    split_strategy?: string;
    [key: string]: unknown;
  };
  // Peringatan dari pipeline NLP.
  warning?: string;
}
