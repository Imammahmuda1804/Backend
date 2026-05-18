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
var NlpController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NlpController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_express_1 = require("@nestjs/platform-express");
const prisma_service_1 = require("../../prisma/prisma.service");
const nlp_service_1 = require("./nlp.service");
const nlp_result_storage_service_1 = require("./nlp-result-storage.service");
const csv_service_1 = require("../scraper/csv.service");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const excel_parser_util_1 = require("./utils/excel-parser.util");
let NlpController = NlpController_1 = class NlpController {
    prisma;
    nlpService;
    nlpStorageService;
    csvService;
    logger = new common_1.Logger(NlpController_1.name);
    constructor(prisma, nlpService, nlpStorageService, csvService) {
        this.prisma = prisma;
        this.nlpService = nlpService;
        this.nlpStorageService = nlpStorageService;
        this.csvService = csvService;
    }
    async uploadAndProcess(file, destinationIdStr) {
        if (!file) {
            throw new common_1.BadRequestException('File harus disertakan');
        }
        const destinationId = parseInt(destinationIdStr, 10);
        if (isNaN(destinationId)) {
            throw new common_1.BadRequestException('destination_id harus berupa angka');
        }
        const destination = await this.prisma.destination.findUnique({
            where: { id: destinationId },
        });
        if (!destination) {
            throw new common_1.NotFoundException('Destinasi tidak ditemukan');
        }
        this.logger.log(`Processing NLP upload for destination "${destination.name}" (${file.originalname})`);
        const reviews = await excel_parser_util_1.ExcelParserUtil.parseUploadedFile(file);
        if (reviews.length === 0) {
            throw new common_1.BadRequestException('File tidak mengandung data ulasan yang valid');
        }
        this.logger.log(`Parsed ${reviews.length} reviews from uploaded file`);
        const reviewIds = [];
        for (const review of reviews) {
            const created = await this.prisma.review.create({
                data: {
                    destinationId,
                    reviewerName: review.reviewerName || 'Anonymous',
                    reviewText: review.reviewText || null,
                    rating: review.rating || null,
                    reviewDate: excel_parser_util_1.ExcelParserUtil.parseIndonesianDate(review.reviewDate),
                    source: 'google_maps',
                    likesCount: review.likesCount || 0,
                    ownerReply: review.ownerReply || null,
                },
            });
            reviewIds.push(created.id);
        }
        this.logger.log(`Inserted ${reviewIds.length} reviews to database`);
        const ratingAgg = await this.prisma.review.aggregate({
            where: { destinationId },
            _avg: { rating: true },
            _count: { rating: true },
        });
        await this.prisma.destination.update({
            where: { id: destinationId },
            data: {
                googleRating: ratingAgg._avg.rating
                    ? parseFloat(ratingAgg._avg.rating.toFixed(2))
                    : null,
                googleReviewCount: ratingAgg._count.rating,
            },
        });
        this.logger.log(`Updated scraped rating: ${ratingAgg._avg.rating?.toFixed(2)} (${ratingAgg._count.rating} reviews)`);
        const nlpData = reviews.map((r, index) => ({
            review_id: reviewIds[index],
            'Teks Ulasan': r.reviewText || '',
            'Nama Pengulas': r.reviewerName || '',
            Rating: r.rating || 0,
            'Tanggal Ulasan': r.reviewDate || '',
            'Jumlah Suka': r.likesCount || 0,
        }));
        const csvString = this.csvService.generateInternalCsv(nlpData);
        const csvBuffer = Buffer.from(csvString);
        let nlpResult;
        try {
            nlpResult = await this.nlpService.processPipeline(csvBuffer, `reviews_upload_${destinationId}.csv`);
            this.logger.log(`FastAPI returned ${nlpResult.results?.length || 0} results`);
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            this.logger.warn(`FastAPI failed: ${errorMessage}`);
            if (process.env.NODE_ENV === 'production') {
                await this.cleanupInsertedReviews(destinationId, reviewIds);
                throw new common_1.BadRequestException(`NLP processing gagal: ${errorMessage}`);
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
                    review_id: reviewIds[i],
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
        this.logger.log(`NLP processing completed for destination "${destination.name}"`);
        return {
            message: 'File berhasil diupload dan NLP processing selesai',
            destination_name: destination.name,
            total_reviews_processed: reviewIds.length,
            scraped_average_rating: ratingAgg._avg.rating
                ? parseFloat(ratingAgg._avg.rating.toFixed(2))
                : null,
            nlp_summary: nlpResult.summary,
        };
    }
    async cleanupInsertedReviews(destinationId, reviewIds) {
        if (reviewIds.length === 0)
            return;
        try {
            await this.prisma.review.deleteMany({
                where: { id: { in: reviewIds } },
            });
            const ratingAgg = await this.prisma.review.aggregate({
                where: { destinationId },
                _avg: { rating: true },
                _count: { rating: true },
            });
            await this.prisma.destination.update({
                where: { id: destinationId },
                data: {
                    googleRating: ratingAgg._avg.rating
                        ? parseFloat(ratingAgg._avg.rating.toFixed(2))
                        : null,
                    googleReviewCount: ratingAgg._count.rating,
                },
            });
            this.logger.warn(`Rolled back ${reviewIds.length} inserted reviews after NLP failure`);
        }
        catch (cleanupError) {
            const cleanupMessage = cleanupError instanceof Error
                ? cleanupError.message
                : String(cleanupError);
            this.logger.error(`Failed to rollback NLP upload reviews: ${cleanupMessage}`);
        }
    }
};
exports.NlpController = NlpController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.HttpCode)(202),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: 50 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            const allowedMimes = [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel',
                'text/csv',
                'application/octet-stream',
            ];
            const allowedExts = ['.xlsx', '.xls', '.csv'];
            const ext = file.originalname
                .toLowerCase()
                .substring(file.originalname.lastIndexOf('.'));
            if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
                cb(null, true);
            }
            else {
                cb(new common_1.BadRequestException('Hanya file Excel (.xlsx) atau CSV (.csv) yang diperbolehkan'), false);
            }
        },
    })),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({
        summary: 'Upload file Excel/CSV dan proses NLP',
        description: 'Upload file hasil scraping. Sistem akan: ' +
            '(1) Membaca & parse file, ' +
            '(2) Menyimpan ulasan ke database, ' +
            '(3) Menghitung rata-rata rating scraping, ' +
            '(4) Menjalankan pipeline NLP (sentiment, topic, embedding).',
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
                destination_id: { type: 'integer' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 202, description: 'NLP processing berhasil dimulai' }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'File tidak valid atau destinasi tidak ditemukan',
    }),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('destination_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], NlpController.prototype, "uploadAndProcess", null);
exports.NlpController = NlpController = NlpController_1 = __decorate([
    (0, swagger_1.ApiTags)('Admin - NLP Processing'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.Controller)('admin/nlp'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        nlp_service_1.NlpService,
        nlp_result_storage_service_1.NlpResultStorageService,
        csv_service_1.CsvService])
], NlpController);
//# sourceMappingURL=nlp.controller.js.map