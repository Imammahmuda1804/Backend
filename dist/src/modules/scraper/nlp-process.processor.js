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
const csv_service_1 = require("./csv.service");
const nlp_service_1 = require("../nlp/nlp.service");
const nlp_result_storage_service_1 = require("../nlp/nlp-result-storage.service");
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
            const reviews = await this.prisma.review.findMany({
                where: { scrapingJobId: jobId },
            });
            if (reviews.length === 0) {
                this.logger.log(`No reviews found for job ${jobId}`);
                return { status: 'success', processed: 0 };
            }
            const nlpData = reviews.map((r, index) => ({
                index,
                'Teks Ulasan': r.reviewText || '',
                'Nama Pengulas': r.reviewerName || '',
                Rating: r.rating || 0,
                'Tanggal Ulasan': r.reviewDate ? r.reviewDate.toISOString() : '',
                'Jumlah Suka': r.likesCount || 0,
            }));
            const reviewIds = reviews.map((r) => r.id);
            const csvString = this.csvService.generateInternalCsv(nlpData);
            const csvBuffer = Buffer.from(csvString);
            let nlpResult;
            try {
                nlpResult = await this.nlpService.processPipeline(csvBuffer, `reviews_job_${jobId}.csv`);
                this.logger.log(`✅ FastAPI returned ${nlpResult.results?.length || 0} results`);
            }
            catch (err) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                this.logger.warn(`FastAPI failed: ${errorMessage}`);
                if (process.env.NODE_ENV === 'production') {
                    throw new Error(`NLP processing failed and fallback is disabled in production: ${errorMessage}`);
                }
                this.logger.warn('Using dummy data fallback (development only).');
                const positiveCount = reviews.filter((r) => r.rating && r.rating >= 4).length;
                const negativeCount = reviews.filter((r) => r.rating && r.rating <= 2).length;
                const neutralCount = reviews.length - positiveCount - negativeCount;
                nlpResult = {
                    summary: {
                        total: reviews.length,
                        positive: positiveCount,
                        negative: negativeCount,
                        neutral: neutralCount,
                    },
                    results: reviews.map((r, i) => ({
                        text: r.reviewText || '',
                        cleaned_text: r.reviewText?.toLowerCase() || '',
                        sentiment: r.rating && r.rating >= 4
                            ? 'positif'
                            : r.rating && r.rating <= 2
                                ? 'negatif'
                                : 'netral',
                        topic_id: null,
                        embedding: Array(384)
                            .fill(0)
                            .map((_, idx) => Math.sin(i * 0.1 + idx * 0.01) * 0.1),
                    })),
                    topics: [],
                };
            }
            await this.nlpStorageService.saveNlpResults(destinationId, nlpResult, reviewIds);
            this.logger.log(`NLP process completed for job ${jobId}`);
            return { status: 'success', processed: nlpResult.results.length };
        }
        catch (error) {
            this.logger.error(`Error processing NLP for job ${jobId}`, error);
            throw error;
        }
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