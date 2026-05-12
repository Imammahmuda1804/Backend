import { Injectable, Logger } from '@nestjs/common';
import { ApifyClient } from 'apify-client';

@Injectable()
export class ApifyService {
  private client: ApifyClient;
  private readonly logger = new Logger(ApifyService.name);

  private readonly MAPS_EXTRACTOR_ACTOR_ID = 'compass/google-maps-extractor';
  private readonly MAPS_REVIEWS_ACTOR_ID =
    'compass/google-maps-reviews-scraper';

  constructor() {
    this.client = new ApifyClient({
      token: process.env.APIFY_API_TOKEN || 'apify_dummy_token',
    });
  }

  /**
   * Mencari tempat di Google Maps.
   * Mendukung dua mode input:
   *  - Teks biasa   → searchStringsArray
   *  - URL Maps     → startUrls (mirip alur Apify-Scrapper)
   */
  async searchPlaces(query: string) {
    this.logger.log(`Searching Google Maps for: ${query}`);

    const input: Record<string, unknown> = {
      maxCrawledPlacesPerSearch: 5,
      language: 'id',
      countryCode: 'id',
    };

    if (query.startsWith('http://') || query.startsWith('https://')) {
      input.startUrls = [{ url: query }];
    } else {
      input.searchStringsArray = [query];
    }

    const run = await this.client
      .actor(this.MAPS_EXTRACTOR_ACTOR_ID)
      .call(input);
    const { items } = await this.client
      .dataset(run.defaultDatasetId)
      .listItems();

    interface ApifyPlaceItem {
      title?: string;
      address?: string;
      totalScore?: number;
      reviewsCount?: number;
      placeId?: string;
      url?: string;
      [key: string]: unknown;
    }

    return (items as ApifyPlaceItem[]).map((item) => ({
      title: item.title,
      address: item.address,
      rating: item.totalScore,
      totalReviews: item.reviewsCount,
      placeId: item.placeId,
      url: item.url,
    }));
  }

  /**
   * Memulai scraping ulasan Google Maps dengan parameter yang dikunci:
   *  - sort     : "newest"  (ulasan terbaru duluan)
   *  - bintang  : semua     (tidak ada filter bintang)
   *  - hasText  : true      (hanya ulasan yang mengandung teks)
   *
   * Satu-satunya variabel yang bisa dikontrol admin adalah maxReviews.
   */
  async startReviewScraping(url: string, maxReviews?: number) {
    this.logger.log(
      `Starting review scraping for: ${url} | maxReviews: ${maxReviews ?? 'ALL'}`,
    );

    const input: Record<string, unknown> = {
      startUrls: [{ url }],
      reviewsSort: 'newest',
      language: 'id',
    };

    if (maxReviews) {
      input.maxReviews = maxReviews;
    }

    const run = await this.client
      .actor(this.MAPS_REVIEWS_ACTOR_ID)
      .start(input);
    return run;
  }

  async waitForRun(runId: string) {
    return await this.client.run(runId).waitForFinish();
  }

  async getRunResults(datasetId: string) {
    const { items } = await this.client.dataset(datasetId).listItems();
    return items;
  }
}
