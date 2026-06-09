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
var NlpProcessProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NlpProcessProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const nlp_result_storage_service_1 = require("../nlp/nlp-result-storage.service");
const nlp_service_1 = require("../nlp/nlp.service");
const csv_service_1 = require("./csv.service");
let NlpProcessProcessor = NlpProcessProcessor_1 = class NlpProcessProcessor extends bullmq_1.WorkerHost {
    prisma;
    csvService;
    nlpService;
    nlpStorageService;
    logger = new common_1.Logger(NlpProcessProcessor_1.name);
    constructor(prisma, csvService, nlpService, nlpStorageService) {
        super();
        this.prisma = prisma;
        this.csvService = csvService;
        this.nlpService = nlpService;
        this.nlpStorageService = nlpStorageService;
    }
    async process(job) {
        const { jobId, destinationId } = job.data;
        this.logger.log(`Processing NLP for job ${jobId}, destination ${destinationId}`);
        try {
            const reviews = await this.findReviewsForJob(jobId);
            if (reviews.length === 0)
                return this.emptyResult(jobId);
            const reviewIds = reviews.map((review) => review.id);
            const csvBuffer = this.createPipelineCsvBuffer(reviews);
            const nlpResult = await this.processWithFallback(csvBuffer, jobId, reviews);
            await this.nlpStorageService.saveNlpResults(destinationId, nlpResult, reviewIds);
            this.logger.log(`NLP process completed for job ${jobId}`);
            return { status: 'success', processed: nlpResult.results.length };
        }
        catch (error) {
            this.logger.error(`Error processing NLP for job ${jobId}`, error);
            throw error;
        }
    }
    emptyResult(jobId) {
        this.logger.log(`No reviews found for job ${jobId}`);
        return { status: 'success', processed: 0 };
    }
    findReviewsForJob(jobId) {
        return this.prisma.review.findMany({
            where: { scrapingJobId: jobId },
            select: {
                id: true,
                reviewText: true,
                reviewerName: true,
                rating: true,
                reviewDate: true,
                likesCount: true,
            },
        });
    }
    createPipelineCsvBuffer(reviews) {
        const nlpData = reviews.map((review, index) => this.toPipelineCsvRow(review, index));
        return Buffer.from(this.csvService.generateInternalCsv(nlpData));
    }
    toPipelineCsvRow(review, index) {
        return {
            index,
            'Teks Ulasan': this.textOrEmpty(review.reviewText),
            'Nama Pengulas': this.textOrEmpty(review.reviewerName),
            Rating: this.numberOrZero(review.rating),
            'Tanggal Ulasan': this.dateToIsoString(review.reviewDate),
            'Jumlah Suka': this.numberOrZero(review.likesCount),
        };
    }
    textOrEmpty(value) {
        return value ?? '';
    }
    numberOrZero(value) {
        return value ?? 0;
    }
    dateToIsoString(value) {
        return value?.toISOString() ?? '';
    }
    async processWithFallback(csvBuffer, jobId, reviews) {
        try {
            return await this.processWithFastApi(csvBuffer, jobId);
        }
        catch (err) {
            return this.handlePipelineFailure(err, reviews);
        }
    }
    async processWithFastApi(csvBuffer, jobId) {
        const nlpResult = await this.nlpService.processPipeline(csvBuffer, `reviews_job_${jobId}.csv`);
        this.logger.log(`FastAPI returned ${nlpResult.results?.length || 0} results`);
        return nlpResult;
    }
    handlePipelineFailure(err, reviews) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        this.logger.warn(`FastAPI failed: ${errorMessage}`);
        if (process.env.NODE_ENV === 'production') {
            throw new Error(`NLP processing failed and fallback is disabled in production: ${errorMessage}`);
        }
        this.logger.warn('Using dummy data fallback (development only).');
        return this.createDevelopmentFallbackResult(reviews);
    }
    createDevelopmentFallbackResult(reviews) {
        const summary = this.countFallbackSentiments(reviews);
        return {
            summary: {
                total: reviews.length,
                positive: summary.positive,
                negative: summary.negative,
                neutral: summary.neutral,
            },
            results: reviews.map((review, index) => ({
                text: review.reviewText || '',
                cleaned_text: review.reviewText?.toLowerCase() || '',
                sentiment: this.toFallbackSentiment(review.rating),
                topic_id: null,
                embedding: this.createFallbackEmbedding(index),
            })),
            topics: [],
        };
    }
    countFallbackSentiments(reviews) {
        const positive = reviews.filter((review) => this.isPositiveRating(review)).length;
        const negative = reviews.filter((review) => this.isNegativeRating(review)).length;
        return {
            positive,
            negative,
            neutral: reviews.length - positive - negative,
        };
    }
    isPositiveRating(review) {
        return Boolean(review.rating && review.rating >= 4);
    }
    isNegativeRating(review) {
        return Boolean(review.rating && review.rating <= 2);
    }
    toFallbackSentiment(rating) {
        return this.getFallbackSentimentBucket(rating ?? 0);
    }
    getFallbackSentimentBucket(score) {
        const bucket = Math.sign(score) * Math.sign(score - 3);
        const labels = {
            [-1]: 'negatif',
            0: 'netral',
            1: 'positif',
        };
        return labels[bucket] ?? 'netral';
    }
    createFallbackEmbedding(seed) {
        return Array(384)
            .fill(0)
            .map((_, index) => Math.sin(seed * 0.1 + index * 0.01) * 0.1);
    }
};
exports.NlpProcessProcessor = NlpProcessProcessor;
exports.NlpProcessProcessor = NlpProcessProcessor = NlpProcessProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('nlp-queue'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        csv_service_1.CsvService,
        nlp_service_1.NlpService,
        nlp_result_storage_service_1.NlpResultStorageService])
], NlpProcessProcessor);
//# sourceMappingURL=nlp-process.processor.js.map