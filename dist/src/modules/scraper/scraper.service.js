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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ScraperService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScraperService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const apify_service_1 = require("./apify.service");
const csv_service_1 = require("./csv.service");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
let ScraperService = ScraperService_1 = class ScraperService {
    prisma;
    apifyService;
    csvService;
    scrapingQueue;
    nlpQueue;
    logger = new common_1.Logger(ScraperService_1.name);
    constructor(prisma, apifyService, csvService, scrapingQueue, nlpQueue) {
        this.prisma = prisma;
        this.apifyService = apifyService;
        this.csvService = csvService;
        this.scrapingQueue = scrapingQueue;
        this.nlpQueue = nlpQueue;
    }
    async searchMaps(query) {
        if (!query || query.trim() === '') {
            throw new common_1.BadRequestException('Query parameter (q) is required');
        }
        try {
            const results = await this.apifyService.searchPlaces(query.trim());
            return results;
        }
        catch (error) {
            this.logger.error('Error searching maps', error);
            throw new common_1.BadRequestException('Failed to search maps via Apify');
        }
    }
    async startScraping(dto, adminId) {
        const destination = await this.prisma.destination.findUnique({
            where: { id: dto.destination_id },
        });
        if (!destination) {
            throw new common_1.NotFoundException('Destination not found');
        }
        const finalMapsUrl = dto.maps_url || destination.googleMapsUrl;
        if (!finalMapsUrl) {
            throw new common_1.BadRequestException('Destinasi belum memiliki URL Google Maps. Sertakan maps_url pada request.');
        }
        const job = await this.prisma.scrapingJob.create({
            data: {
                destinationId: destination.id,
                status: 'pending',
                createdBy: adminId,
            },
        });
        await this.scrapingQueue.add('scrape-reviews', {
            jobId: job.id,
            destinationId: destination.id,
            url: finalMapsUrl,
            maxReviews: dto.max_reviews,
        });
        this.logger.log(`Scraping job #${job.id} queued for destination "${destination.name}" (maxReviews: ${dto.max_reviews ?? 'ALL'})`);
        return {
            job_id: job.id,
            status: 'pending',
            destination_name: destination.name,
            maps_url: finalMapsUrl,
            message: 'Scraping job started. Ulasan akan diambil: terbaru, semua bintang, hanya yang berteks.',
        };
    }
    async getJobStatus(jobId) {
        const job = await this.prisma.scrapingJob.findUnique({
            where: { id: jobId },
            include: {
                destination: {
                    select: { name: true, city: true, province: true },
                },
            },
        });
        if (!job) {
            throw new common_1.NotFoundException('Scraping job not found');
        }
        return job;
    }
    async getAllJobs(page, limit, status) {
        const skip = (page - 1) * limit;
        const whereCondition = status ? { status } : {};
        const [data, total] = await Promise.all([
            this.prisma.scrapingJob.findMany({
                where: whereCondition,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    destination: {
                        select: { name: true, city: true },
                    },
                },
            }),
            this.prisma.scrapingJob.count({ where: whereCondition }),
        ]);
        return {
            data,
            meta: {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit),
            },
        };
    }
    async getHistory(page, limit, destinationId) {
        const skip = (page - 1) * limit;
        const whereCondition = destinationId ? { destinationId } : {};
        const [data, total] = await Promise.all([
            this.prisma.scrapingHistory.findMany({
                where: whereCondition,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    destination: {
                        select: { name: true },
                    },
                    job: true,
                },
            }),
            this.prisma.scrapingHistory.count({ where: whereCondition }),
        ]);
        return {
            data,
            meta: {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit),
            },
        };
    }
    async downloadCsv(jobId) {
        const job = await this.prisma.scrapingJob.findUnique({
            where: { id: jobId },
        });
        if (!job) {
            throw new common_1.NotFoundException('Scraping job not found');
        }
        if (job.status !== 'completed') {
            throw new common_1.BadRequestException('Job is not completed yet');
        }
        const reviews = await this.prisma.review.findMany({
            where: { scrapingJobId: jobId },
            select: {
                id: true,
                reviewerName: true,
                rating: true,
                reviewText: true,
                reviewDate: true,
                likesCount: true,
            },
        });
        const csvData = this.csvService.generateCsv(reviews);
        return csvData;
    }
    async processNlp(jobId) {
        const job = await this.prisma.scrapingJob.findUnique({
            where: { id: jobId },
        });
        if (!job) {
            throw new common_1.NotFoundException('Scraping job not found');
        }
        if (job.status !== 'completed') {
            throw new common_1.BadRequestException('Job is not completed yet');
        }
        await this.nlpQueue.add('process-nlp', {
            jobId,
            destinationId: job.destinationId,
        });
        return {
            message: 'NLP processing started',
            job_id: jobId,
        };
    }
};
exports.ScraperService = ScraperService;
exports.ScraperService = ScraperService = ScraperService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, bullmq_1.InjectQueue)('scraping-queue')),
    __param(4, (0, bullmq_1.InjectQueue)('nlp-queue')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        apify_service_1.ApifyService,
        csv_service_1.CsvService,
        bullmq_2.Queue,
        bullmq_2.Queue])
], ScraperService);
//# sourceMappingURL=scraper.service.js.map