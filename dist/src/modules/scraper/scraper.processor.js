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
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const apify_service_1 = require("./apify.service");
let ScraperProcessor = ScraperProcessor_1 = class ScraperProcessor extends bullmq_1.WorkerHost {
    prisma;
    apifyService;
    logger = new common_1.Logger(ScraperProcessor_1.name);
    constructor(prisma, apifyService) {
        super();
        this.prisma = prisma;
        this.apifyService = apifyService;
    }
    async process(job) {
        const { jobId, destinationId, url, maxReviews } = job.data;
        this.logger.log(`Processing scraping job ${jobId} for destination ${destinationId}`);
        await this.prisma.scrapingJob.update({
            where: { id: jobId },
            data: { status: 'running', startedAt: new Date() },
        });
        try {
            const apifyRun = await this.apifyService.startReviewScraping(url, maxReviews);
            const runId = apifyRun.id;
            this.logger.log(`Waiting for Apify run ${runId} to finish...`);
            const finishedRun = await this.apifyService.waitForRun(runId);
            const runStatus = finishedRun.status;
            const datasetId = finishedRun.defaultDatasetId;
            if (runStatus !== 'SUCCEEDED') {
                throw new Error(`Apify run failed with status: ${runStatus}`);
            }
            this.logger.log(`Fetching results from dataset ${datasetId}...`);
            const results = await this.apifyService.getRunResults(datasetId);
            this.logger.log(`Saving ${results.length} reviews to database...`);
            let savedCount = 0;
            for (const item of results) {
                const reviewText = (item.text || item.reviewText);
                const rating = (item.stars || item.rating);
                const reviewerName = (item.name ||
                    item.reviewerName ||
                    'Anonymous');
                const reviewDateStr = (item.publishedAtDate || item.date);
                if (!reviewText || reviewText.trim().length === 0)
                    continue;
                if (!rating)
                    continue;
                const reviewDate = reviewDateStr ? new Date(reviewDateStr) : null;
                await this.prisma.review.create({
                    data: {
                        destinationId,
                        reviewerName,
                        reviewText,
                        rating,
                        reviewDate,
                        source: 'google_maps',
                        likesCount: item.likesCount || 0,
                        ownerReply: item.responseFromOwnerText || null,
                        scrapingJobId: jobId,
                    },
                });
                savedCount++;
            }
            await this.prisma.scrapingJob.update({
                where: { id: jobId },
                data: {
                    status: 'completed',
                    finishedAt: new Date(),
                    totalReviews: savedCount,
                },
            });
            await this.prisma.scrapingHistory.create({
                data: {
                    destinationId,
                    jobId,
                    totalReviews: savedCount,
                    starsFilter: client_1.Prisma.JsonNull,
                    hasText: true,
                    sort: 'newest',
                },
            });
            this.logger.log(`Successfully finished scraping job ${jobId}, saved ${savedCount} reviews`);
            return { status: 'success', savedCount };
        }
        catch (error) {
            this.logger.error(`Error in scraping job ${jobId}`, error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await this.prisma.scrapingJob.update({
                where: { id: jobId },
                data: {
                    status: 'failed',
                    finishedAt: new Date(),
                    errorMessage,
                },
            });
            throw error;
        }
    }
};
exports.ScraperProcessor = ScraperProcessor;
exports.ScraperProcessor = ScraperProcessor = ScraperProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('scraping-queue'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        apify_service_1.ApifyService])
], ScraperProcessor);
//# sourceMappingURL=scraper.processor.js.map