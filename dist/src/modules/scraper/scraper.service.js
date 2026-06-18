"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ScraperService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScraperService = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const bullmq_2 = require("bullmq");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prisma_service_1 = require("../../prisma/prisma.service");
const apify_service_1 = require("./apify.service");
let ScraperService = ScraperService_1 = class ScraperService {
    prisma;
    apifyService;
    scrapingQueue;
    logger = new common_1.Logger(ScraperService_1.name);
    constructor(prisma, apifyService, scrapingQueue) {
        this.prisma = prisma;
        this.apifyService = apifyService;
        this.scrapingQueue = scrapingQueue;
    }
    async searchMaps(query) {
        if (!query || query.trim() === '') {
            throw new common_1.BadRequestException('Query parameter (q) is required');
        }
        try {
            return await this.apifyService.searchPlaces(query.trim());
        }
        catch (error) {
            const readableError = this.apifyService.toReadableError(error);
            this.logger.error(`Error searching maps: ${readableError}`, error);
            throw new common_1.BadRequestException(readableError);
        }
    }
    async startScraping(dto, adminId) {
        const destination = await this.findScraperDestination(dto.destination_id);
        const finalMapsUrl = this.resolveMapsUrl(dto, destination);
        const effectiveMaxReviews = this.resolveMaxReviews(dto);
        const job = await this.createPendingScrapingJob(destination.id, adminId);
        await this.enqueueScrapingJob(job.id, destination, finalMapsUrl, effectiveMaxReviews);
        this.logQueuedJob(job.id, destination.name, effectiveMaxReviews);
        return this.buildStartScrapingResponse(job.id, destination.name, finalMapsUrl);
    }
    async getScrapingOverview(destinationId, mapsUrl) {
        const destination = await this.findScraperDestination(destinationId);
        const finalMapsUrl = this.resolveOverviewMapsUrl(destination, mapsUrl);
        const [livePlace, storedTextReviews, processedReviews, latestNlpRun, latestJob,] = await Promise.all([
            this.fetchLivePlaceSnapshot(finalMapsUrl),
            this.countStoredTextReviews(destination.id),
            this.countProcessedReviews(destination.id),
            this.findLatestNlpRun(destination.id),
            this.findLatestScrapingJob(destination.id),
        ]);
        const liveTotalReviews = livePlace?.totalReviews ?? null;
        return {
            destination_id: destination.id,
            destination_name: destination.name,
            maps_url: finalMapsUrl,
            live_google: {
                title: livePlace?.title ?? null,
                address: livePlace?.address ?? null,
                rating: livePlace?.rating ?? null,
                total_reviews: liveTotalReviews,
                place_id: livePlace?.placeId ?? null,
                fetched_at: new Date().toISOString(),
            },
            cached_destination: {
                google_rating: destination.googleRating,
                google_review_count: destination.googleReviewCount,
            },
            database: {
                stored_text_reviews: storedTextReviews,
                processed_reviews: processedReviews,
                latest_nlp_run: latestNlpRun,
                latest_scraping_job: latestJob,
            },
            coverage: {
                stored_text_reviews_percent: this.toPercent(storedTextReviews, liveTotalReviews),
                processed_reviews_percent: this.toPercent(processedReviews, liveTotalReviews),
            },
            text_filter_note: 'Scraper tetap menyimpan ulasan yang memiliki teks. Rating tanpa teks tidak masuk ke file hasil scraping.',
        };
    }
    async findScraperDestination(destinationId) {
        const destination = await this.prisma.destination.findUnique({
            where: { id: destinationId },
            select: {
                id: true,
                name: true,
                googleMapsUrl: true,
                googleRating: true,
                googleReviewCount: true,
            },
        });
        if (!destination)
            throw new common_1.NotFoundException('Destination not found');
        return destination;
    }
    resolveOverviewMapsUrl(destination, mapsUrl) {
        const finalMapsUrl = mapsUrl?.trim() || destination.googleMapsUrl;
        if (!finalMapsUrl) {
            throw new common_1.BadRequestException('Destinasi belum memiliki URL Google Maps. Isi URL Maps untuk melihat ringkasan live.');
        }
        return finalMapsUrl;
    }
    async fetchLivePlaceSnapshot(mapsUrl) {
        try {
            const places = (await this.apifyService.searchPlaces(mapsUrl));
            return places[0] ?? null;
        }
        catch (error) {
            const readableError = this.apifyService.toReadableError(error);
            this.logger.error(`Error fetching scraper overview: ${readableError}`);
            throw new common_1.BadRequestException(readableError);
        }
    }
    countStoredTextReviews(destinationId) {
        return this.prisma.review.count({
            where: {
                destinationId,
                reviewText: { not: null },
            },
        });
    }
    countProcessedReviews(destinationId) {
        return this.prisma.review.count({
            where: {
                destinationId,
                sentiment: { not: null },
            },
        });
    }
    findLatestNlpRun(destinationId) {
        return this.prisma.nlpProcessingRun.findFirst({
            where: { destinationId },
            orderBy: { startedAt: 'desc' },
            select: {
                id: true,
                fileName: true,
                mode: true,
                status: true,
                totalRows: true,
                insertedReviews: true,
                skippedDuplicates: true,
                processedReviews: true,
                startedAt: true,
                finishedAt: true,
            },
        });
    }
    findLatestScrapingJob(destinationId) {
        return this.prisma.scrapingJob.findFirst({
            where: { destinationId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                status: true,
                totalReviews: true,
                startedAt: true,
                finishedAt: true,
                createdAt: true,
            },
        });
    }
    toPercent(current, total) {
        if (!total || total <= 0)
            return null;
        return Math.min(100, Math.round((current / total) * 100));
    }
    resolveMapsUrl(dto, destination) {
        const finalMapsUrl = dto.maps_url || destination.googleMapsUrl;
        if (!finalMapsUrl) {
            throw new common_1.BadRequestException('Destinasi belum memiliki URL Google Maps. Sertakan maps_url pada request.');
        }
        return finalMapsUrl;
    }
    resolveMaxReviews(dto) {
        return dto.fetch_all_reviews ? undefined : dto.max_reviews;
    }
    createPendingScrapingJob(destinationId, adminId) {
        return this.prisma.scrapingJob.create({
            data: {
                destinationId,
                status: 'pending',
                createdBy: adminId,
            },
        });
    }
    enqueueScrapingJob(jobId, destination, finalMapsUrl, effectiveMaxReviews) {
        return this.scrapingQueue.add('scrape-reviews', {
            jobId,
            destinationId: destination.id,
            destinationName: destination.name,
            url: finalMapsUrl,
            maxReviews: effectiveMaxReviews,
        });
    }
    logQueuedJob(jobId, destinationName, effectiveMaxReviews) {
        this.logger.log(`Scraping job #${jobId} queued for destination "${destinationName}" (target: ${effectiveMaxReviews ?? 'ALL'} text reviews)`);
    }
    buildStartScrapingResponse(jobId, destinationName, mapsUrl) {
        return {
            job_id: jobId,
            status: 'pending',
            destination_name: destinationName,
            maps_url: mapsUrl,
            message: 'Scraping job dimulai. Sistem akan mengambil ulasan berteks sesuai jumlah yang diminta. Hasil berupa file Excel yang bisa diunduh.',
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
                        select: { name: true, city: true, province: true },
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
    async downloadExcel(jobId) {
        const job = await this.findCompletedScrapingJob(jobId);
        const jobFilePath = this.resolveScrapedExcelPath(jobId);
        const filename = this.buildDownloadExcelFileName(job);
        return { filePath: jobFilePath, filename };
    }
    async findCompletedScrapingJob(jobId) {
        const job = await this.prisma.scrapingJob.findUnique({
            where: { id: jobId },
            include: {
                destination: { select: { name: true } },
            },
        });
        if (!job)
            throw new common_1.NotFoundException('Scraping job not found');
        if (job.status !== 'completed') {
            throw new common_1.BadRequestException('Job belum selesai');
        }
        return job;
    }
    resolveScrapedExcelPath(jobId) {
        if (!Number.isSafeInteger(jobId) || jobId <= 0) {
            throw new common_1.BadRequestException('Job ID tidak valid');
        }
        const uploadDir = path.join(process.cwd(), 'uploads', 'scraped_data');
        const jobFilePath = path.join(uploadDir, `job_${jobId}.xlsx`);
        if (!fs.existsSync(jobFilePath)) {
            throw new common_1.NotFoundException('File Excel tidak ditemukan. Mungkin sudah dihapus.');
        }
        return jobFilePath;
    }
    buildDownloadExcelFileName(job) {
        const safeName = this.toSafeFileName(job.destination?.name);
        const dateStr = this.toDownloadDate(job.createdAt);
        const reviewCount = job.totalReviews || 0;
        return `[RanahInsight]_Scrape_${safeName}_${reviewCount}_Reviews_${dateStr}.xlsx`;
    }
    toSafeFileName(value) {
        return (value || 'Destination')
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 40);
    }
    toDownloadDate(value) {
        return new Date(value)
            .toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
            .replace(/ /g, '-');
    }
};
exports.ScraperService = ScraperService;
exports.ScraperService = ScraperService = ScraperService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bullmq_1.InjectQueue)('scraping-queue')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        apify_service_1.ApifyService,
        bullmq_2.Queue])
], ScraperService);
//# sourceMappingURL=scraper.service.js.map