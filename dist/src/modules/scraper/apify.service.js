"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ApifyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApifyService = void 0;
const common_1 = require("@nestjs/common");
const apify_client_1 = require("apify-client");
let ApifyService = ApifyService_1 = class ApifyService {
    client;
    logger = new common_1.Logger(ApifyService_1.name);
    MAPS_EXTRACTOR_ACTOR_ID = 'compass/google-maps-extractor';
    MAPS_REVIEWS_ACTOR_ID = 'compass/google-maps-reviews-scraper';
    constructor() {
        this.client = new apify_client_1.ApifyClient({
            token: process.env.APIFY_API_TOKEN ||
                process.env.APIFY_TOKEN ||
                'apify_dummy_token',
        });
    }
    toReadableError(error) {
        const message = this.extractErrorMessage(error);
        const normalized = message.toLowerCase();
        if (normalized.includes('token') ||
            normalized.includes('unauthorized') ||
            normalized.includes('authentication') ||
            normalized.includes('401')) {
            return 'Token Apify tidak valid atau belum dikonfigurasi. Periksa APIFY_API_TOKEN di environment backend.';
        }
        if (normalized.includes('quota') ||
            normalized.includes('limit') ||
            normalized.includes('credit') ||
            normalized.includes('insufficient') ||
            normalized.includes('payment') ||
            normalized.includes('billing')) {
            return 'Limit atau credit Apify habis. Tambah credit/kuota Apify atau tunggu kuota tersedia sebelum menjalankan scraper lagi.';
        }
        if (normalized.includes('timeout') || normalized.includes('timed out')) {
            return 'Scraper Apify timeout. Coba kurangi jumlah ulasan atau ulangi job beberapa menit lagi.';
        }
        return message || 'Scraper Apify gagal. Periksa log backend dan dashboard Apify.';
    }
    extractErrorMessage(error) {
        if (error instanceof Error)
            return error.message;
        if (typeof error === 'string')
            return error;
        try {
            return JSON.stringify(error);
        }
        catch {
            return '';
        }
    }
    async searchPlaces(query) {
        this.logger.log(`Searching Google Maps for: ${query}`);
        const input = {
            maxCrawledPlacesPerSearch: 5,
            language: 'id',
            countryCode: 'id',
        };
        if (query.startsWith('http://') || query.startsWith('https://')) {
            input.startUrls = [{ url: query }];
        }
        else {
            input.searchStringsArray = [query];
        }
        const run = await this.client
            .actor(this.MAPS_EXTRACTOR_ACTOR_ID)
            .call(input);
        const { items } = await this.client
            .dataset(run.defaultDatasetId)
            .listItems();
        return items.map((item) => ({
            title: item.title,
            address: item.address,
            rating: item.totalScore,
            totalReviews: item.reviewsCount,
            placeId: item.placeId,
            url: item.url,
        }));
    }
    async startReviewScraping(url, maxReviews) {
        this.logger.log(`Starting review scraping for: ${url} | maxReviews: ${maxReviews ?? 'ALL'}`);
        const input = {
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
    async waitForRun(runId) {
        return await this.client.run(runId).waitForFinish();
    }
    async getRunResults(datasetId) {
        const { items } = await this.client.dataset(datasetId).listItems();
        return items;
    }
};
exports.ApifyService = ApifyService;
exports.ApifyService = ApifyService = ApifyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ApifyService);
//# sourceMappingURL=apify.service.js.map