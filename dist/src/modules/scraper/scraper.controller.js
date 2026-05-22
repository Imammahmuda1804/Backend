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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScraperController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const scraper_service_1 = require("./scraper.service");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const dto_1 = require("./dto");
let ScraperController = class ScraperController {
    scraperService;
    constructor(scraperService) {
        this.scraperService = scraperService;
    }
    async searchMaps(query) {
        return this.scraperService.searchMaps(query.q);
    }
    async startScraping(dto, user) {
        return this.scraperService.startScraping(dto, user?.id);
    }
    async getJobStatus(jobId) {
        return this.scraperService.getJobStatus(jobId);
    }
    async getJobs(query) {
        return this.scraperService.getAllJobs(query.page ?? 1, query.limit ?? 10, query.status);
    }
    async getHistory(query) {
        return this.scraperService.getHistory(query.page ?? 1, query.limit ?? 10, query.destination_id);
    }
    async downloadExcel(jobId, res) {
        const { filePath, filename } = await this.scraperService.downloadExcel(jobId);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        return res.sendFile(filePath);
    }
};
exports.ScraperController = ScraperController;
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Cari tempat di Google Maps' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Hasil pencarian berhasil diambil' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - ADMIN only' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.SearchQueryDto]),
    __metadata("design:returntype", Promise)
], ScraperController.prototype, "searchMaps", null);
__decorate([
    (0, common_1.Post)('start'),
    (0, swagger_1.ApiOperation)({ summary: 'Mulai scraping review destinasi' }),
    (0, swagger_1.ApiBody)({ type: dto_1.StartScrapingDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Job scraping berhasil dibuat' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - ADMIN only' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.StartScrapingDto, Object]),
    __metadata("design:returntype", Promise)
], ScraperController.prototype, "startScraping", null);
__decorate([
    (0, common_1.Get)('status/:jobId'),
    (0, swagger_1.ApiOperation)({ summary: 'Status job scraping' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status job berhasil diambil' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Job tidak ditemukan' }),
    __param(0, (0, common_1.Param)('jobId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ScraperController.prototype, "getJobStatus", null);
__decorate([
    (0, common_1.Get)('jobs'),
    (0, swagger_1.ApiOperation)({ summary: 'List job scraping' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Daftar job berhasil diambil' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.JobQueryDto]),
    __metadata("design:returntype", Promise)
], ScraperController.prototype, "getJobs", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, swagger_1.ApiOperation)({ summary: 'Riwayat review hasil scraping' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Riwayat scraping berhasil diambil',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.HistoryQueryDto]),
    __metadata("design:returntype", Promise)
], ScraperController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)('download/:jobId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Download hasil scraping sebagai file Excel (.xlsx)',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'File Excel berhasil diunduh' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Job belum selesai' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — ADMIN only' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Job atau file tidak ditemukan' }),
    __param(0, (0, common_1.Param)('jobId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ScraperController.prototype, "downloadExcel", null);
exports.ScraperController = ScraperController = __decorate([
    (0, swagger_1.ApiTags)('Admin - Scraper'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.Controller)('admin/scraper'),
    __metadata("design:paramtypes", [scraper_service_1.ScraperService])
], ScraperController);
//# sourceMappingURL=scraper.controller.js.map