import { ParsedReview } from './utils/excel-parser.util';

export type ReviewWithHash = ParsedReview & { reviewHash: string };

export type ProcessReview = ReviewWithHash & { id: number };

export type PreparedNlpFile = {
  destinationId: number;
  destinationName: string;
  fileName: string;
  fileHash: string;
  hashedReviews: ReviewWithHash[];
};

export type ReviewProcessingPlan = {
  processReviews: ProcessReview[];
  insertedReviewIds: number[];
  skippedDuplicates: number;
};
