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
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const apify_service_1 = require("./apify.service");
const csv_service_1 = require("./csv.service");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let ScraperService = ScraperService_1 = class ScraperService {
    prisma;
    apifyService;
    csvService;
    scrapingQueue;
    logger = new common_1.Logger(ScraperService_1.name);
    constructor(prisma, apifyService, csvService, scrapingQueue) {
        this.prisma = prisma;
        this.apifyService = apifyService;
        this.csvService = csvService;
        this.scrapingQueue = scrapingQueue;
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
        const effectiveMaxReviews = dto.fetch_all_reviews
            ? undefined
            : dto.max_reviews;
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
            destinationName: destination.name,
            url: finalMapsUrl,
            maxReviews: effectiveMaxReviews,
        });
        this.logger.log(`Scraping job #${job.id} queued for destination "${destination.name}" (target: ${effectiveMaxReviews ?? 'ALL'} text reviews)`);
        return {
            job_id: job.id,
            status: 'pending',
            destination_name: destination.name,
            maps_url: finalMapsUrl,
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
    async downloadExcel(jobId) {
        const job = await this.prisma.scrapingJob.findUnique({
            where: { id: jobId },
            include: {
                destination: { select: { name: true } },
            },
        });
        if (!job) {
            throw new common_1.NotFoundException('Scraping job not found');
        }
        if (job.status !== 'completed') {
            throw new common_1.BadRequestException('Job belum selesai');
        }
        const uploadDir = path.join(process.cwd(), 'uploads', 'scraped_data');
        const jobFilePath = path.join(uploadDir, `job_${jobId}.xlsx`);
        if (!fs.existsSync(jobFilePath)) {
            throw new common_1.NotFoundException('File Excel tidak ditemukan. Mungkin sudah dihapus.');
        }
        const safeName = (job.destination?.name || 'Destination')
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 40);
        const dateStr = new Date(job.createdAt)
            .toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
            .replace(/ /g, '-');
        const filename = `[RanahInsight]_Scrape_${safeName}_${job.totalReviews || 0}_Reviews_${dateStr}.xlsx`;
        return { filePath: jobFilePath, filename };
    }
};
exports.ScraperService = ScraperService;
exports.ScraperService = ScraperService = ScraperService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, bullmq_1.InjectQueue)('scraping-queue')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        apify_service_1.ApifyService,
        csv_service_1.CsvService,
        bullmq_2.Queue])
], ScraperService);
//# sourceMappingURL=scraper.service.js.map