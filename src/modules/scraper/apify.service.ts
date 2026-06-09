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
      token:
        process.env.APIFY_API_TOKEN ||
        process.env.APIFY_TOKEN ||
        'apify_dummy_token',
    });
  }

  // Mengubah error teknis Apify menjadi pesan yang bisa langsung dipahami admin.
  toReadableError(error: unknown) {
    const message = this.extractErrorMessage(error);
    const normalized = message.toLowerCase();

    if (
      normalized.includes('token') ||
      normalized.includes('unauthorized') ||
      normalized.includes('authentication') ||
      normalized.includes('401')
    ) {
      return 'Token Apify tidak valid atau belum dikonfigurasi. Periksa APIFY_API_TOKEN di environment backend.';
    }

    if (
      normalized.includes('quota') ||
      normalized.includes('limit') ||
      normalized.includes('credit') ||
      normalized.includes('insufficient') ||
      normalized.includes('payment') ||
      normalized.includes('billing')
    ) {
      return 'Limit atau credit Apify habis. Tambah credit/kuota Apify atau tunggu kuota tersedia sebelum menjalankan scraper lagi.';
    }

    if (normalized.includes('timeout') || normalized.includes('timed out')) {
      return 'Scraper Apify timeout. Coba kurangi jumlah ulasan atau ulangi job beberapa menit lagi.';
    }

    return message || 'Scraper Apify gagal. Periksa log backend dan dashboard Apify.';
  }

  private extractErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    try {
      return JSON.stringify(error);
    } catch {
      return '';
    }
  }

  // Mencari tempat di Google Maps.
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

  // Memulai scraping ulasan Google Maps.
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
