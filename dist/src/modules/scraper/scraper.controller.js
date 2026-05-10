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
const dto_1 = require("./dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
let ScraperController = class ScraperController {
    scraperService;
    constructor(scraperService) {
        this.scraperService = scraperService;
    }
    async searchMaps(query) {
        const results = await this.scraperService.searchMaps(query.q);
        return results;
    }
    async startScraping(dto, req) {
        const user = req.user;
        const adminId = user?.id;
        return this.scraperService.startScraping(dto, adminId);
    }
    async getJobStatus(jobId) {
        return this.scraperService.getJobStatus(jobId);
    }
    async getJobs(query) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        return this.scraperService.getAllJobs(page, limit, query.status);
    }
    async getHistory(query) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        return this.scraperService.getHistory(page, limit, query.destination_id);
    }
    async downloadCsv(jobId, res) {
        const csvData = await this.scraperService.downloadCsv(jobId);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="reviews_job_${jobId}.csv"`);
        return res.send(csvData);
    }
    async processNlp(jobId) {
        return this.scraperService.processNlp(jobId);
    }
};
exports.ScraperController = ScraperController;
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Cari tempat wisata di Google Maps via Apify' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Search results from Google Maps' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — ADMIN only' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.SearchQueryDto]),
    __metadata("design:returntype", Promise)
], ScraperController.prototype, "searchMaps", null);
__decorate([
    (0, common_1.Post)('start'),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    (0, swagger_1.ApiOperation)({ summary: 'Trigger scraping reviews dari Google Maps' }),
    (0, swagger_1.ApiResponse)({ status: 202, description: 'Scraping job started' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — ADMIN only' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Destination not found' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.StartScrapingDto, Object]),
    __metadata("design:returntype", Promise)
], ScraperController.prototype, "startScraping", null);
__decorate([
    (0, common_1.Get)('status/:jobId'),
    (0, swagger_1.ApiOperation)({ summary: 'Polling scraping progress' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Job status retrieved' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — ADMIN only' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Job not found' }),
    __param(0, (0, common_1.Param)('jobId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ScraperController.prototype, "getJobStatus", null);
__decorate([
    (0, common_1.Get)('jobs'),
    (0, swagger_1.ApiOperation)({ summary: 'List semua scraping jobs' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated list of scraping jobs' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — ADMIN only' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.JobQueryDto]),
    __metadata("design:returntype", Promise)
], ScraperController.prototype, "getJobs", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, swagger_1.ApiOperation)({ summary: 'Riwayat scraping per destination' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated scraping history' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — ADMIN only' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.HistoryQueryDto]),
    __metadata("design:returntype", Promise)
], ScraperController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)('download/:jobId'),
    (0, swagger_1.ApiOperation)({ summary: 'Download hasil scraping sebagai file CSV' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'CSV file downloaded' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — ADMIN only' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Job not found or no reviews' }),
    __param(0, (0, common_1.Param)('jobId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ScraperController.prototype, "downloadCsv", null);
__decorate([
    (0, common_1.Post)('process/:jobId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    (0, swagger_1.ApiOperation)({ summary: 'Trigger NLP pipeline processing' }),
    (0, swagger_1.ApiResponse)({ status: 202, description: 'NLP processing started' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — ADMIN only' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Job not found' }),
    __param(0, (0, common_1.Param)('jobId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ScraperController.prototype, "processNlp", null);
exports.ScraperController = ScraperController = __decorate([
    (0, swagger_1.ApiTags)('Admin - Scraper'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.Controller)('admin/scraper'),
    __metadata("design:paramtypes", [scraper_service_1.ScraperService])
], ScraperController);
//# sourceMappingURL=scraper.controller.js.map