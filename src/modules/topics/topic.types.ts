export type TopicScope = 'search' | 'detail';

export type TopicGroupPayload = {
  groupName: string;
  description?: string;
  keywords?: string[];
  displayOrder?: number;
};

export type TopicReviewSentiment = 'positive' | 'neutral' | 'negative';

export type TopicForAiRename = {
  id: number;
  topicName: string;
  keywords: unknown;
};

export type TopicHeader = {
  id: number;
  topicName: string;
  group: { id: number; groupName: string } | null;
};

export type TopicReviewRow = {
  id: number;
  reviewerName: string | null;
  reviewText: string | null;
  rating: number | null;
  reviewDate: Date | null;
  sentiment: string | null;
  sentimentConfidence: number | null;
  destination: unknown;
  topicAssignments?: Array<{
    topicId: number;
    score: number;
    isPrimary: boolean;
    assignmentMethod: string;
  }>;
};

export type SentimentSummaryRow = {
  sentiment: string | null;
  _count: { _all: number };
};
