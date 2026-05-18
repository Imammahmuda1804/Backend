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
    topic_id: number | null;
    embedding: number[];
  }>;
  topics: Array<{
    topic_id: number;
    keywords: string[];
  }>;
  /** Topik baru yang ditemukan oleh BIRCH clustering saat pipeline berjalan */
  new_topics?: Array<{
    topic_id: number;
    keywords: string[];
  }>;
  /** Peringatan jika terjadi graceful degradation (OOM, dll) */
  warning?: string;
}
