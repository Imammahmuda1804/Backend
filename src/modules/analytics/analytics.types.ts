export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly';

export type SentimentDistribution = {
  positive: number;
  negative: number;
  neutral: number;
};

export type CompareTopicSignal = {
  topic_name: string;
  total_reviews: number;
  group_name?: string | null;
};

export type CompareFactorKey =
  | 'access'
  | 'cost_value'
  | 'cleanliness'
  | 'facilities'
  | 'crowd'
  | 'view_activity';

export type CompareDestinationSnapshot = {
  id: number;
  name: string;
  slug: string;
  city: string;
  province: string;
  category: string;
  thumbnailUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  googleMapsUrl: string | null;
  sentiment: SentimentDistribution;
  topics: CompareTopicSignal[];
  top_topics: CompareTopicSignal[];
  topic_groups: Array<{ group_name: string; total_reviews: number }>;
  rating: { google: number | null; user: number | null };
  recommendation_score: number | null;
  positive_ratio: number | null;
  review_count: number;
  travel_traits: Record<string, number>;
  decision_factors: Record<CompareFactorKey, number>;
  highlights: string[];
  risks: string[];
};
