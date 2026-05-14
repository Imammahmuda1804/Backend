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
var ScraperProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScraperProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const apify_service_1 = require("./apify.service");
const ExcelJS = __importStar(require("exceljs"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
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
        const { jobId, destinationId, url, maxReviews, destinationName } = job.data;
        this.logger.log(`Processing scraping job ${jobId} for destination ${destinationId}`);
        await this.prisma.scrapingJob.update({
            where: { id: jobId },
            data: { status: 'running', startedAt: new Date() },
        });
        try {
            await this.fetchAndSaveGoogleRating(destinationId, url);
            const oversampledMax = maxReviews ? maxReviews * 3 : undefined;
            const apifyRun = await this.apifyService.startReviewScraping(url, oversampledMax);
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
            this.logger.log(`Got ${results.length} raw results. Filtering text-only reviews...`);
            const textReviews = results.filter((item) => {
                const reviewText = (item.text || item.reviewText);
                const rating = (item.stars || item.rating);
                return reviewText && reviewText.trim().length > 0 && rating;
            });
            const finalReviews = maxReviews
                ? textReviews.slice(0, maxReviews)
                : textReviews;
            this.logger.log(`Filtered to ${finalReviews.length} text reviews (requested: ${maxReviews ?? 'ALL'})`);
            const filePath = await this.generateExcel(finalReviews, jobId, destinationId, destinationName || 'Destination');
            await this.prisma.scrapingJob.update({
                where: { id: jobId },
                data: {
                    status: 'completed',
                    finishedAt: new Date(),
                    totalReviews: finalReviews.length,
                },
            });
            await this.prisma.scrapingHistory.create({
                data: {
                    destinationId,
                    jobId,
                    totalReviews: finalReviews.length,
                    hasText: true,
                    sort: 'newest',
                },
            });
            this.logger.log(`Successfully finished scraping job ${jobId}, generated Excel with ${finalReviews.length} reviews at ${filePath}`);
            return { status: 'success', savedCount: finalReviews.length, filePath };
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
    async fetchAndSaveGoogleRating(destinationId, mapsUrl) {
        try {
            const dest = await this.prisma.destination.findUnique({
                where: { id: destinationId },
                select: { googleRating: true, googleReviewCount: true },
            });
            if (dest?.googleRating !== null && dest?.googleRating !== undefined) {
                this.logger.log(`Destination ${destinationId} already has Google rating: ${dest.googleRating}`);
                return;
            }
            this.logger.log(`Fetching Google Maps info for destination ${destinationId}...`);
            const places = await this.apifyService.searchPlaces(mapsUrl);
            if (places.length > 0) {
                const place = places[0];
                await this.prisma.destination.update({
                    where: { id: destinationId },
                    data: {
                        googleRating: place.rating ?? null,
                        googleReviewCount: place.totalReviews ?? null,
                    },
                });
                this.logger.log(`Saved Google Rating: ${place.rating}, Review Count: ${place.totalReviews}`);
            }
        }
        catch (err) {
            this.logger.warn(`Failed to fetch Google rating (non-critical): ${err instanceof Error ? err.message : err}`);
        }
    }
    async generateExcel(reviews, jobId, destinationId, destinationName) {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'RanahInsight';
        workbook.created = new Date();
        const sheet = workbook.addWorksheet('Ulasan', {
            views: [{ state: 'frozen', ySplit: 1 }],
        });
        sheet.columns = [
            { header: 'No', key: 'no', width: 6 },
            { header: 'Nama Pengulas', key: 'reviewerName', width: 22 },
            { header: 'Rating', key: 'rating', width: 10 },
            { header: 'Teks Ulasan', key: 'reviewText', width: 60 },
            { header: 'Tanggal Ulasan', key: 'reviewDate', width: 18 },
            { header: 'Jumlah Suka', key: 'likesCount', width: 14 },
            { header: 'Balasan Pemilik', key: 'ownerReply', width: 40 },
        ];
        const headerRow = sheet.getRow(1);
        headerRow.height = 28;
        headerRow.eachCell((cell) => {
            cell.font = {
                name: 'Calibri',
                size: 11,
                bold: true,
                color: { argb: 'FFFFFFFF' },
            };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF2D82B5' },
            };
            cell.alignment = {
                vertical: 'middle',
                horizontal: 'center',
                wrapText: true,
            };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FF1A5276' } },
                bottom: { style: 'thin', color: { argb: 'FF1A5276' } },
                left: { style: 'thin', color: { argb: 'FF1A5276' } },
                right: { style: 'thin', color: { argb: 'FF1A5276' } },
            };
        });
        reviews.forEach((item, index) => {
            const reviewText = (item.text || item.reviewText || '');
            const rating = (item.stars || item.rating || 0);
            const reviewerName = (item.name ||
                item.reviewerName ||
                'Anonymous');
            const reviewDateStr = (item.publishedAtDate || item.date);
            const reviewDate = reviewDateStr
                ? new Date(reviewDateStr).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                })
                : '-';
            const likesCount = item.likesCount || 0;
            const ownerReply = item.responseFromOwnerText || '-';
            const row = sheet.addRow({
                no: index + 1,
                reviewerName,
                rating,
                reviewText,
                reviewDate,
                likesCount,
                ownerReply,
            });
            const bgColor = index % 2 === 0 ? 'FFFFFFFF' : 'FFF8F9FA';
            const borderColor = { argb: 'FFE2E8F0' };
            row.eachCell((cell, colNumber) => {
                cell.font = { name: 'Calibri', size: 10 };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: bgColor },
                };
                cell.border = {
                    top: { style: 'thin', color: borderColor },
                    bottom: { style: 'thin', color: borderColor },
                    left: { style: 'thin', color: borderColor },
                    right: { style: 'thin', color: borderColor },
                };
                if (colNumber === 4 || colNumber === 7) {
                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: 'left',
                        wrapText: true,
                    };
                }
                else {
                    cell.alignment = {
                        vertical: 'middle',
                        horizontal: 'center',
                        wrapText: true,
                    };
                }
                if (colNumber === 3) {
                    cell.font = {
                        name: 'Calibri',
                        size: 10,
                        bold: true,
                        color: {
                            argb: rating >= 4
                                ? 'FF16A34A'
                                : rating >= 3
                                    ? 'FFCA8A04'
                                    : 'FFDC2626',
                        },
                    };
                }
            });
        });
        sheet.autoFilter = {
            from: { row: 1, column: 1 },
            to: { row: reviews.length + 1, column: 7 },
        };
        const uploadDir = path.join(process.cwd(), 'uploads', 'scraped_data');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        const safeName = destinationName
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 40);
        const dateStr = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }).replace(/ /g, '-');
        const filename = `[RanahInsight]_Scrape_${safeName}_${reviews.length}_Reviews_${dateStr}.xlsx`;
        const filePath = path.join(uploadDir, filename);
        await workbook.xlsx.writeFile(filePath);
        const jobFilePath = path.join(uploadDir, `job_${jobId}.xlsx`);
        if (fs.existsSync(jobFilePath)) {
            fs.unlinkSync(jobFilePath);
        }
        fs.copyFileSync(filePath, jobFilePath);
        this.logger.log(`Excel file saved: ${filename}`);
        return filePath;
    }
};
exports.ScraperProcessor = ScraperProcessor;
exports.ScraperProcessor = ScraperProcessor = ScraperProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('scraping-queue'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        apify_service_1.ApifyService])
], ScraperProcessor);
//# sourceMappingURL=scraper.processor.js.map