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
const ExcelJS = __importStar(require("exceljs"));
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
        const reviews = await this.parseUploadedFile(file);
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
                    reviewDate: this.parseIndonesianDate(review.reviewDate),
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
                userRating: ratingAgg._avg.rating
                    ? parseFloat(ratingAgg._avg.rating.toFixed(2))
                    : null,
                userReviewCount: ratingAgg._count.rating,
            },
        });
        this.logger.log(`Updated scraped rating: ${ratingAgg._avg.rating?.toFixed(2)} (${ratingAgg._count.rating} reviews)`);
        const nlpData = reviews.map((r, index) => ({
            review_id: reviewIds[index],
            'Teks Ulasan': r.reviewText || '',
            'Nama Pengulas': r.reviewerName || '',
            'Rating': r.rating || 0,
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
    async parseUploadedFile(file) {
        const ext = file.originalname
            .toLowerCase()
            .substring(file.originalname.lastIndexOf('.'));
        if (ext === '.xlsx' || ext === '.xls') {
            return this.parseExcel(file.buffer);
        }
        else if (ext === '.csv') {
            return this.parseCsv(file.buffer);
        }
        throw new common_1.BadRequestException('Format file tidak didukung');
    }
    async parseExcel(buffer) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const sheet = workbook.getWorksheet(1);
        if (!sheet) {
            throw new common_1.BadRequestException('File Excel tidak memiliki worksheet');
        }
        const reviews = [];
        const headerRow = sheet.getRow(1);
        const headers = {};
        headerRow.eachCell((cell, colNumber) => {
            const val = String(cell.value || '').trim().toLowerCase();
            headers[colNumber] = val;
        });
        this.logger.log(`📋 Raw Excel headers: ${JSON.stringify(headers)}`);
        const colMap = this.buildColumnMap(headers);
        this.logger.log(`📋 Column map result: ${JSON.stringify(colMap)}`);
        let isFirstDataRow = true;
        sheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1)
                return;
            const reviewText = this.getCellString(row, colMap.reviewText);
            const rating = this.getCellNumber(row, colMap.rating);
            const reviewerName = this.getCellString(row, colMap.reviewerName) || 'Anonymous';
            const reviewDate = this.getCellString(row, colMap.reviewDate);
            const likesCount = this.getCellNumber(row, colMap.likesCount) || 0;
            const ownerReply = this.getCellString(row, colMap.ownerReply);
            if (isFirstDataRow) {
                this.logger.log(`📋 Row ${rowNumber} sample data:`);
                this.logger.log(`   reviewText (col ${colMap.reviewText}): "${(reviewText || '').substring(0, 80)}"`);
                this.logger.log(`   reviewDate (col ${colMap.reviewDate}): "${reviewDate}"`);
                this.logger.log(`   reviewerName (col ${colMap.reviewerName}): "${reviewerName}"`);
                this.logger.log(`   rating (col ${colMap.rating}): ${rating}`);
                this.logger.log(`   Raw cells: ${JSON.stringify(Array.from({ length: 7 }, (_, i) => {
                    const cell = row.getCell(i + 1);
                    return { col: i + 1, value: String(cell.value || '').substring(0, 50), type: typeof cell.value };
                }))}`);
                isFirstDataRow = false;
            }
            if (reviewText && reviewText.trim().length > 0) {
                reviews.push({
                    reviewerName,
                    reviewText,
                    rating,
                    reviewDate,
                    likesCount,
                    ownerReply,
                });
            }
        });
        return reviews;
    }
    parseCsv(buffer) {
        const content = buffer.toString('utf-8');
        const lines = content.split('\n').filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
            throw new common_1.BadRequestException('File CSV kosong atau tidak valid');
        }
        const headerLine = lines[0];
        const headerParts = this.parseCsvLine(headerLine);
        const headers = {};
        headerParts.forEach((h, i) => {
            headers[i + 1] = h.trim().toLowerCase();
        });
        const colMap = this.buildColumnMap(headers);
        const reviews = [];
        for (let i = 1; i < lines.length; i++) {
            const parts = this.parseCsvLine(lines[i]);
            const getCellStr = (col) => col !== null && parts[col - 1] ? parts[col - 1].trim() : '';
            const getCellNum = (col) => {
                const val = getCellStr(col);
                const num = parseInt(val, 10);
                return isNaN(num) ? null : num;
            };
            const reviewText = getCellStr(colMap.reviewText);
            if (reviewText && reviewText.length > 0) {
                reviews.push({
                    reviewerName: getCellStr(colMap.reviewerName) || 'Anonymous',
                    reviewText,
                    rating: getCellNum(colMap.rating),
                    reviewDate: getCellStr(colMap.reviewDate),
                    likesCount: getCellNum(colMap.likesCount) || 0,
                    ownerReply: getCellStr(colMap.ownerReply),
                });
            }
        }
        return reviews;
    }
    buildColumnMap(headers) {
        const map = {
            reviewerName: null,
            reviewText: null,
            rating: null,
            reviewDate: null,
            likesCount: null,
            ownerReply: null,
        };
        const normalizedHeaders = [];
        for (const [colStr, header] of Object.entries(headers)) {
            normalizedHeaders.push({
                col: parseInt(colStr, 10),
                normalized: header.toLowerCase().trim().replace(/[\s\-]/g, '_'),
            });
        }
        const usedCols = new Set();
        const findMatch = (canonicalNames) => {
            for (const name of canonicalNames) {
                const match = normalizedHeaders.find((h) => h.normalized === name && !usedCols.has(h.col));
                if (match) {
                    usedCols.add(match.col);
                    return match.col;
                }
            }
            return null;
        };
        map.reviewText = findMatch([
            'teks_ulasan', 'review_text', 'reviewtext', 'text', 'content', 'komentar', 'review',
        ]);
        map.reviewDate = findMatch([
            'tanggal_ulasan', 'review_date', 'reviewdate', 'published_at', 'publishedatdate', 'date', 'tanggal', 'time', 'waktu', 'ulasan_date',
        ]);
        map.reviewerName = findMatch([
            'nama_pengulas', 'reviewer_name', 'reviewername', 'name', 'author', 'user', 'nama', 'penulis',
        ]);
        map.rating = findMatch([
            'rating', 'stars', 'star', 'score', 'bintang', 'nilai',
        ]);
        map.likesCount = findMatch([
            'jumlah_suka', 'likes_count', 'likescount', 'likes', 'like', 'helpful', 'suka', 'berguna',
        ]);
        map.ownerReply = findMatch([
            'balasan_pemilik', 'owner_reply', 'responsefromownertext', 'response', 'balasan',
        ]);
        this.logger.log(`NLP Controller Column Mapping: ${JSON.stringify(map)}`);
        return map;
    }
    getCellString(row, col) {
        if (col === null)
            return '';
        const cell = row.getCell(col);
        const val = cell.value;
        if (val === null || val === undefined)
            return '';
        if (typeof val === 'object' && 'richText' in val) {
            return val.richText.map((r) => r.text).join('');
        }
        return String(val).trim();
    }
    getCellNumber(row, col) {
        if (col === null)
            return null;
        const cell = row.getCell(col);
        const val = cell.value;
        if (val === null || val === undefined)
            return null;
        const num = Number(val);
        return isNaN(num) ? null : num;
    }
    parseCsvLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                }
                else {
                    inQuotes = !inQuotes;
                }
            }
            else if (ch === ',' && !inQuotes) {
                result.push(current);
                current = '';
            }
            else {
                current += ch;
            }
        }
        result.push(current);
        return result;
    }
    parseIndonesianDate(dateStr) {
        if (!dateStr || dateStr === '-')
            return null;
        const indonesianMonths = {
            jan: 'Jan', januari: 'Jan',
            feb: 'Feb', februari: 'Feb',
            mar: 'Mar', maret: 'Mar',
            apr: 'Apr', april: 'Apr',
            mei: 'May', may: 'May',
            jun: 'Jun', juni: 'Jun',
            jul: 'Jul', juli: 'Jul',
            agu: 'Aug', agustus: 'Aug', aug: 'Aug',
            sep: 'Sep', september: 'Sep',
            okt: 'Oct', oktober: 'Oct', oct: 'Oct',
            nov: 'Nov', november: 'Nov',
            des: 'Dec', desember: 'Dec', dec: 'Dec'
        };
        let englishDateStr = dateStr.toLowerCase();
        for (const [id, en] of Object.entries(indonesianMonths)) {
            if (englishDateStr.includes(id)) {
                englishDateStr = englishDateStr.replace(new RegExp(`\\b${id}\\b`, 'g'), en);
                break;
            }
        }
        const d = new Date(englishDateStr);
        return isNaN(d.getTime()) ? null : d;
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
            if (allowedMimes.includes(file.mimetype) ||
                allowedExts.includes(ext)) {
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
    (0, swagger_1.ApiResponse)({ status: 400, description: 'File tidak valid atau destinasi tidak ditemukan' }),
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