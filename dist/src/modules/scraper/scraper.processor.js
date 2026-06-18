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
var ScraperProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScraperProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const apify_service_1 = require("./apify.service");
const scraped_review_util_1 = require("./scraped-review.util");
const scraper_workbook_service_1 = require("./scraper-workbook.service");
let ScraperProcessor = ScraperProcessor_1 = class ScraperProcessor extends bullmq_1.WorkerHost {
    prisma;
    apifyService;
    workbookService;
    logger = new common_1.Logger(ScraperProcessor_1.name);
    constructor(prisma, apifyService, workbookService) {
        super();
        this.prisma = prisma;
        this.apifyService = apifyService;
        this.workbookService = workbookService;
    }
    async process(job) {
        const { jobId, destinationId, url, maxReviews, destinationName } = job.data;
        this.logJobStart(jobId, destinationId);
        try {
            return await this.processScrapingJob({
                jobId,
                destinationId,
                url,
                maxReviews,
                destinationName,
            });
        }
        catch (error) {
            await this.handleScrapingFailure(jobId, error);
            throw error;
        }
    }
    logJobStart(jobId, destinationId) {
        this.logger.log(`Processing scraping job ${jobId} for destination ${destinationId}`);
    }
    async processScrapingJob(data) {
        await this.markJobRunning(data.jobId);
        await this.fetchAndSaveGoogleRating(data.destinationId, data.url);
        const results = await this.scrapeReviews(data.url, data.maxReviews);
        const finalReviews = this.getTextReviews(results, data.maxReviews);
        this.logFilteredReviewCount(finalReviews.length, data.maxReviews);
        const filePath = await this.workbookService.generate(finalReviews, data.jobId, this.getDestinationNameForFile(data.destinationName));
        await this.completeSuccessfulJob(data.jobId, data.destinationId, finalReviews.length);
        this.logJobSuccess(data.jobId, finalReviews.length, filePath);
        return { status: 'success', savedCount: finalReviews.length, filePath };
    }
    getDestinationNameForFile(destinationName) {
        return destinationName ?? 'Destination';
    }
    logFilteredReviewCount(count, requested) {
        this.logger.log(`Filtered to ${count} text reviews (requested: ${requested ?? 'ALL'})`);
    }
    logJobSuccess(jobId, savedCount, filePath) {
        this.logger.log(`Successfully finished scraping job ${jobId}, generated Excel with ${savedCount} reviews at ${filePath}`);
    }
    async handleScrapingFailure(jobId, error) {
        const readableError = this.apifyService.toReadableError(error);
        this.logger.error(`Error in scraping job ${jobId}: ${readableError}`, error);
        await this.failJob(jobId, readableError);
    }
    async markJobRunning(jobId) {
        await this.prisma.scrapingJob.update({
            where: { id: jobId },
            data: { status: 'running', startedAt: new Date() },
        });
    }
    async scrapeReviews(mapsUrl, maxReviews) {
        const oversampledMax = maxReviews ? maxReviews * 3 : undefined;
        const apifyRun = await this.apifyService.startReviewScraping(mapsUrl, oversampledMax);
        this.logger.log(`Waiting for Apify run ${apifyRun.id} to finish...`);
        const finishedRun = await this.apifyService.waitForRun(apifyRun.id);
        if (finishedRun.status !== 'SUCCEEDED') {
            throw new Error(`Apify run failed with status: ${finishedRun.status}`);
        }
        this.logger.log(`Fetching results from dataset ${finishedRun.defaultDatasetId}...`);
        return this.apifyService.getRunResults(finishedRun.defaultDatasetId);
    }
    getTextReviews(results, maxReviews) {
        this.logger.log(`Got ${results.length} raw results. Filtering text-only reviews...`);
        const textReviews = results.filter((item) => {
            const reviewText = (0, scraped_review_util_1.getScrapedReviewText)(item);
            const rating = (0, scraped_review_util_1.getScrapedReviewRating)(item);
            return reviewText.trim().length > 0 && rating > 0;
        });
        return maxReviews ? textReviews.slice(0, maxReviews) : textReviews;
    }
    async completeSuccessfulJob(jobId, destinationId, totalReviews) {
        await this.prisma.scrapingJob.update({
            where: { id: jobId },
            data: {
                status: 'completed',
                finishedAt: new Date(),
                totalReviews,
            },
        });
        await this.prisma.scrapingHistory.create({
            data: {
                destinationId,
                jobId,
                totalReviews,
                hasText: true,
                sort: 'newest',
            },
        });
    }
    async failJob(jobId, errorMessage) {
        await this.prisma.scrapingJob.update({
            where: { id: jobId },
            data: {
                status: 'failed',
                finishedAt: new Date(),
                errorMessage,
            },
        });
    }
    async fetchAndSaveGoogleRating(destinationId, mapsUrl) {
        try {
            if (await this.destinationAlreadyHasGoogleRating(destinationId))
                return;
            const place = await this.fetchFirstGooglePlace(destinationId, mapsUrl);
            if (place)
                await this.saveGooglePlaceRating(destinationId, place);
        }
        catch (err) {
            this.warnGoogleRatingFetchFailed(err);
        }
    }
    async destinationAlreadyHasGoogleRating(destinationId) {
        const destination = await this.prisma.destination.findUnique({
            where: { id: destinationId },
            select: { googleRating: true, googleReviewCount: true },
        });
        if (!this.hasGoogleRating(destination))
            return false;
        this.logger.log(`Destination ${destinationId} already has Google rating: ${destination.googleRating}`);
        return true;
    }
    async fetchFirstGooglePlace(destinationId, mapsUrl) {
        this.logger.log(`Fetching Google Maps info for destination ${destinationId}...`);
        const places = await this.apifyService.searchPlaces(mapsUrl);
        return places[0] ?? null;
    }
    async saveGooglePlaceRating(destinationId, place) {
        await this.prisma.destination.update({
            where: { id: destinationId },
            data: {
                googleRating: place.rating ?? null,
                googleReviewCount: place.totalReviews ?? null,
            },
        });
        this.logger.log(`Saved Google Rating: ${place.rating}, Review Count: ${place.totalReviews}`);
    }
    warnGoogleRatingFetchFailed(err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Failed to fetch Google rating (non-critical): ${errorMessage}`);
    }
    hasGoogleRating(destination) {
        return (destination?.googleRating !== null &&
            destination?.googleRating !== undefined);
    }
};
exports.ScraperProcessor = ScraperProcessor;
exports.ScraperProcessor = ScraperProcessor = ScraperProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('scraping-queue'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        apify_service_1.ApifyService,
        scraper_workbook_service_1.ScraperWorkbookService])
], ScraperProcessor);
//# sourceMappingURL=scraper.processor.js.map