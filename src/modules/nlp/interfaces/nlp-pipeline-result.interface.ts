export interface NlpPipelineResult {
  summary: {
    total: number;
    positive: number;
    negative: number;
    neutral: number;
  };
  results: Array<{
    text: string;
    cleaned_text: string;
    sentiment: string; // "positif", "negatif", "netral"
    topic_id: number | null;
    embedding: number[];
  }>;
  topics: Array<{
    topic_id: number;
    keywords: string[];
  }>;
}
