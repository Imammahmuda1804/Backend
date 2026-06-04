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
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const excel_parser_util_1 = require("./utils/excel-parser.util");
const nlp_dedup_util_1 = require("./utils/nlp-dedup.util");
const NLP_UPLOAD_FILE_OPTIONS = {
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
};
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
    async preflight(file, destinationIdStr) {
        const destinationId = this.parseDestinationId(destinationIdStr);
        const destination = await this.getDestinationOrThrow(destinationId);
        const reviews = await this.parseFileOrThrow(file);
        const hashedReviews = (0, nlp_dedup_util_1.attachReviewHashes)(destinationId, reviews);
        const fileHash = (0, nlp_dedup_util_1.createFileHash)(file.buffer);
        const existingHashes = await this.getExistingReviewHashes(destinationId, hashedReviews);
        const previousRun = await this.prisma.nlpProcessingRun.findFirst({
            where: { destinationId, fileHash },
            orderBy: { startedAt: 'desc' },
            select: {
                id: true,
                status: true,
                mode: true,
                startedAt: true,
                insertedReviews: true,
                skippedDuplicates: true,
                processedReviews: true,
            },
        });
        const duplicateRows = hashedReviews.filter((review) => existingHashes.has(review.reviewHash)).length;
        return {
            destination_id: destinationId,
            destination_name: destination.name,
            file_name: file.originalname,
            file_hash: fileHash,
            total_rows: hashedReviews.length,
            new_reviews: hashedReviews.length - duplicateRows,
            duplicate_reviews: duplicateRows,
            already_processed: Boolean(previousRun),
            previous_run: previousRun,
            recommended_mode: previousRun && duplicateRows === hashedReviews.length
                ? 'reprocess_existing'
                : 'skip_existing',
        };
    }
    async getHistory(destinationId, status, page = '1', limit = '10') {
        const currentPage = Math.max(parseInt(page, 10) || 1, 1);
        const take = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
        const skip = (currentPage - 1) * take;
        const where = {
            ...(destinationId ? { destinationId: parseInt(destinationId, 10) } : {}),
            ...(status ? { status } : {}),
        };
        const [data, total] = await Promise.all([
            this.prisma.nlpProcessingRun.findMany({
                where,
                skip,
                take,
                orderBy: { startedAt: 'desc' },
                include: {
                    destination: { select: { id: true, name: true, city: true } },
                    admin: { select: { id: true, name: true, email: true } },
                },
            }),
            this.prisma.nlpProcessingRun.count({ where }),
        ]);
        return {
            data,
            meta: {
                page: currentPage,
                limit: take,
                total,
                totalPages: Math.ceil(total / take),
            },
        };
    }
    async getHistoryDetail(id) {
        const runId = parseInt(id, 10);
        if (isNaN(runId))
            throw new common_1.BadRequestException('id harus berupa angka');
        const run = await this.prisma.nlpProcessingRun.findUnique({
            where: { id: runId },
            include: {
                destination: { select: { id: true, name: true, city: true } },
                admin: { select: { id: true, name: true, email: true } },
            },
        });
        if (!run)
            throw new common_1.NotFoundException('Riwayat proses NLP tidak ditemukan');
        return run;
    }
    async uploadAndProcess(file, destinationIdStr, rawMode, adminId) {
        const destinationId = this.parseDestinationId(destinationIdStr);
        const mode = (0, nlp_dedup_util_1.normalizeNlpMode)(rawMode);
        const destination = await this.getDestinationOrThrow(destinationId);
        const reviews = await this.parseFileOrThrow(file);
        const hashedReviews = (0, nlp_dedup_util_1.attachReviewHashes)(destinationId, reviews);
        const fileHash = (0, nlp_dedup_util_1.createFileHash)(file.buffer);
        const run = await this.prisma.nlpProcessingRun.create({
            data: {
                destinationId,
                adminId,
                fileName: file.originalname,
                fileHash,
                mode,
                status: 'processing',
                totalRows: hashedReviews.length,
            },
        });
        const insertedReviewIds = [];
        try {
            if (mode === 'replace_existing') {
                await this.resetDestinationNlpData(destinationId);
            }
            const existingReviews = mode === 'replace_existing'
                ? new Map()
                : await this.getExistingReviewMap(destinationId, hashedReviews);
            const duplicateRows = hashedReviews.filter((review) => existingReviews.has(review.reviewHash)).length;
            const processReviews = [];
            for (const review of hashedReviews) {
                const existingId = existingReviews.get(review.reviewHash);
                if (existingId) {
                    if (mode === 'reprocess_existing') {
                        processReviews.push({ ...review, id: existingId });
                    }
                    continue;
                }
                const created = await this.prisma.review.create({
                    data: {
                        destinationId,
                        reviewerName: review.reviewerName || 'Anonymous',
                        reviewText: review.reviewText || null,
                        rating: review.rating || null,
                        reviewDate: excel_parser_util_1.ExcelParserUtil.parseIndonesianDate(review.reviewDate),
                        source: 'google_maps',
                        reviewHash: review.reviewHash,
                        likesCount: review.likesCount || 0,
                        ownerReply: review.ownerReply || null,
                    },
                });
                insertedReviewIds.push(created.id);
                processReviews.push({ ...review, id: created.id });
            }
            if (processReviews.length > 0) {
                const nlpResult = await this.runPipeline(destinationId, processReviews);
                await this.nlpStorageService.saveNlpResults(destinationId, nlpResult, processReviews.map((review) => review.id));
            }
            const ratingAgg = await this.refreshDestinationRating(destinationId);
            await this.prisma.nlpProcessingRun.update({
                where: { id: run.id },
                data: {
                    status: 'completed',
                    insertedReviews: insertedReviewIds.length,
                    skippedDuplicates: mode === 'replace_existing'
                        ? 0
                        : mode === 'skip_existing'
                            ? duplicateRows
                            : Math.max(0, duplicateRows - processReviews.length),
                    processedReviews: processReviews.length,
                    finishedAt: new Date(),
                },
            });
            this.logger.log(`NLP processing completed for destination "${destination.name}"`);
            return {
                message: 'File berhasil diupload dan NLP processing selesai',
                run_id: run.id,
                mode,
                destination_name: destination.name,
                total_reviews_processed: processReviews.length,
                inserted_reviews: insertedReviewIds.length,
                skipped_duplicates: mode === 'replace_existing'
                    ? 0
                    : hashedReviews.length - insertedReviewIds.length,
                scraped_average_rating: ratingAgg._avg.rating
                    ? parseFloat(ratingAgg._avg.rating.toFixed(2))
                    : null,
                nlp_summary: await this.getSentimentSummary(destinationId),
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`NLP processing failed: ${errorMessage}`);
            if (mode !== 'replace_existing') {
                await this.cleanupInsertedReviews(destinationId, insertedReviewIds);
            }
            await this.prisma.nlpProcessingRun.update({
                where: { id: run.id },
                data: {
                    status: 'failed',
                    errorMessage,
                    insertedReviews: insertedReviewIds.length,
                    finishedAt: new Date(),
                },
            });
            throw new common_1.BadRequestException(`NLP processing gagal: ${errorMessage}`);
        }
    }
    parseDestinationId(destinationIdStr) {
        const destinationId = parseInt(destinationIdStr, 10);
        if (isNaN(destinationId)) {
            throw new common_1.BadRequestException('destination_id harus berupa angka');
        }
        return destinationId;
    }
    async getDestinationOrThrow(destinationId) {
        const destination = await this.prisma.destination.findUnique({
            where: { id: destinationId },
        });
        if (!destination)
            throw new common_1.NotFoundException('Destinasi tidak ditemukan');
        return destination;
    }
    async parseFileOrThrow(file) {
        if (!file)
            throw new common_1.BadRequestException('File harus disertakan');
        const reviews = await excel_parser_util_1.ExcelParserUtil.parseUploadedFile(file);
        if (reviews.length === 0) {
            throw new common_1.BadRequestException('File tidak mengandung data ulasan valid');
        }
        return reviews;
    }
    async getExistingReviewHashes(destinationId, reviews) {
        const existing = await this.prisma.review.findMany({
            where: {
                destinationId,
                source: 'google_maps',
                reviewHash: { in: reviews.map((review) => review.reviewHash) },
            },
            select: { reviewHash: true },
        });
        return new Set(existing.map((review) => review.reviewHash).filter(Boolean));
    }
    async getExistingReviewMap(destinationId, reviews) {
        const existing = await this.prisma.review.findMany({
            where: {
                destinationId,
                source: 'google_maps',
                reviewHash: { in: reviews.map((review) => review.reviewHash) },
            },
            select: { id: true, reviewHash: true },
        });
        return new Map(existing
            .filter((review) => review.reviewHash)
            .map((review) => [review.reviewHash, review.id]));
    }
    async runPipeline(destinationId, reviews) {
        const nlpData = reviews.map((review) => ({
            review_id: review.id,
            'Teks Ulasan': review.reviewText || '',
            'Nama Pengulas': review.reviewerName || '',
            Rating: review.rating || 0,
            'Tanggal Ulasan': review.reviewDate || '',
            'Jumlah Suka': review.likesCount || 0,
        }));
        const csvString = this.csvService.generateInternalCsv(nlpData);
        const csvBuffer = Buffer.from(csvString);
        try {
            const nlpResult = await this.nlpService.processPipeline(csvBuffer, `reviews_upload_${destinationId}.csv`);
            this.logger.log(`FastAPI returned ${nlpResult.results?.length || 0} results`);
            this.assertValidPipelineResult(nlpResult, reviews.length);
            return nlpResult;
        }
        catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            this.logger.warn(`FastAPI failed: ${errorMessage}`);
            throw err;
        }
    }
    assertValidPipelineResult(nlpResult, expectedCount) {
        const results = nlpResult.results ?? [];
        if (expectedCount > 0 && results.length === 0) {
            throw new common_1.BadRequestException('Model NLP tidak mengembalikan hasil untuk review yang diproses.');
        }
        const hasTopicList = (nlpResult.topics ?? []).length > 0;
        const hasMappedTopic = results.some((result) => result.topic_id !== null && result.topic_id !== undefined);
        if (expectedCount > 0 && !hasTopicList && !hasMappedTopic) {
            throw new common_1.BadRequestException('Model NLP tidak mengembalikan topik. Pastikan service Model aktif dan model BERTopic berhasil dimuat.');
        }
    }
    async resetDestinationNlpData(destinationId) {
        await this.prisma.review.deleteMany({
            where: { destinationId, source: 'google_maps' },
        });
        await this.prisma.destinationTopic.deleteMany({ where: { destinationId } });
        await this.prisma.sentimentTrend.deleteMany({ where: { destinationId } });
    }
    async refreshDestinationRating(destinationId) {
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
        return ratingAgg;
    }
    async getSentimentSummary(destinationId) {
        const grouped = await this.prisma.review.groupBy({
            by: ['sentiment'],
            where: { destinationId, sentiment: { not: null } },
            _count: { _all: true },
        });
        const summary = { total: 0, positive: 0, negative: 0, neutral: 0 };
        for (const item of grouped) {
            const count = item._count._all;
            summary.total += count;
            if (item.sentiment === 'positive')
                summary.positive += count;
            else if (item.sentiment === 'negative')
                summary.negative += count;
            else
                summary.neutral += count;
        }
        return summary;
    }
    async cleanupInsertedReviews(destinationId, reviewIds) {
        if (reviewIds.length === 0)
            return;
        try {
            await this.prisma.review.deleteMany({
                where: { id: { in: reviewIds } },
            });
            await this.refreshDestinationRating(destinationId);
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
    (0, common_1.Post)('preflight'),
    (0, common_1.HttpCode)(200),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', NLP_UPLOAD_FILE_OPTIONS)),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({
        summary: 'Cek file NLP sebelum diproses',
        description: 'Membaca file review, menghitung hash file/review, dan mengembalikan jumlah review baru serta duplikat.',
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
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('destination_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], NlpController.prototype, "preflight", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, swagger_1.ApiOperation)({ summary: 'List riwayat proses NLP admin' }),
    (0, swagger_1.ApiQuery)({ name: 'destination_id', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, common_1.Query)('destination_id')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], NlpController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)('history/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Detail riwayat proses NLP admin' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NlpController.prototype, "getHistoryDetail", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.HttpCode)(202),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', NLP_UPLOAD_FILE_OPTIONS)),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({
        summary: 'Upload file Excel/CSV dan proses NLP',
        description: 'Upload file hasil scraping dengan dedup review. Mode default skip_existing agar file yang sama tidak membuat review duplikat.',
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
                destination_id: { type: 'integer' },
                mode: {
                    type: 'string',
                    enum: ['skip_existing', 'reprocess_existing', 'replace_existing'],
                },
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
    __param(2, (0, common_1.Body)('mode')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Number]),
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