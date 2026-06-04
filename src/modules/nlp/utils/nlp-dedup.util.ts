import { createHash } from 'crypto';
import { ParsedReview, ExcelParserUtil } from './excel-parser.util';

export type NlpProcessingMode =
  | 'skip_existing'
  | 'reprocess_existing'
  | 'replace_existing';

export function normalizeNlpMode(mode?: string): NlpProcessingMode {
  if (
    mode === 'reprocess_existing' ||
    mode === 'replace_existing' ||
    mode === 'skip_existing'
  ) {
    return mode;
  }
  return 'skip_existing';
}

export function createFileHash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

function normalizeText(value?: string | null): string {
  return (value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeDate(value?: string | null): string {
  const date = ExcelParserUtil.parseIndonesianDate(value || null);
  return date ? date.toISOString().slice(0, 10) : normalizeText(value);
}

export function createReviewHash(
  destinationId: number,
  review: ParsedReview,
  source = 'google_maps',
): string {
  const payload = [
    destinationId,
    normalizeText(source),
    normalizeText(review.reviewerName || 'Anonymous'),
    normalizeText(review.reviewText),
    review.rating ?? '',
    normalizeDate(review.reviewDate),
  ].join('|');

  return createHash('sha256').update(payload).digest('hex');
}

export function attachReviewHashes(
  destinationId: number,
  reviews: ParsedReview[],
): Array<ParsedReview & { reviewHash: string }> {
  return reviews.map((review) => ({
    ...review,
    reviewHash: createReviewHash(destinationId, review),
  }));
}
