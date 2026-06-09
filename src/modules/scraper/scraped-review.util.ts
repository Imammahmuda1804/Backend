import type { ScrapedReviewItem } from './scraped-review.types';

export function getScrapedReviewText(item: ScrapedReviewItem) {
  return item.text ?? item.reviewText ?? '';
}

export function getScrapedReviewRating(item: ScrapedReviewItem) {
  return item.stars ?? item.rating ?? 0;
}
