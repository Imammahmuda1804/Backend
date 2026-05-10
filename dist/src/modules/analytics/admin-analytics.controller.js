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
exports.AdminAnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const analytics_service_1 = require("./analytics.service");
const dto_1 = require("./dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
let AdminAnalyticsController = class AdminAnalyticsController {
    analyticsService;
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    async getAdminSummary() {
        return this.analyticsService.getAdminSummary();
    }
    async getAdminActivity() {
        return this.analyticsService.getAdminActivity();
    }
    async getAdminTrends(query) {
        return this.analyticsService.getAdminTrends(query.period);
    }
    async exportCsv(destinationId, res) {
        const { csv, filename } = await this.analyticsService.exportAnalyticsCsv(destinationId);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    }
};
exports.AdminAnalyticsController = AdminAnalyticsController;
__decorate([
    (0, common_1.Get)('dashboard/summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin dashboard summary' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Summary berhasil diambil' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — ADMIN only' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminAnalyticsController.prototype, "getAdminSummary", null);
__decorate([
    (0, common_1.Get)('dashboard/activity'),
    (0, swagger_1.ApiOperation)({ summary: 'Recent activity untuk admin dashboard' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Activity berhasil diambil' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminAnalyticsController.prototype, "getAdminActivity", null);
__decorate([
    (0, common_1.Get)('dashboard/trends'),
    (0, swagger_1.ApiOperation)({ summary: 'Trend data (daily/weekly/monthly)' }),
    (0, swagger_1.ApiQuery)({
        name: 'period',
        required: false,
        enum: ['daily', 'weekly', 'monthly'],
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Trend data berhasil diambil' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.TrendsQueryDto]),
    __metadata("design:returntype", Promise)
], AdminAnalyticsController.prototype, "getAdminTrends", null);
__decorate([
    (0, common_1.Get)('analytics/export/:destinationId'),
    (0, swagger_1.ApiOperation)({ summary: 'Export analytics destinasi sebagai CSV' }),
    (0, swagger_1.ApiParam)({ name: 'destinationId', type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'CSV file berhasil didownload' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Destinasi tidak ditemukan' }),
    __param(0, (0, common_1.Param)('destinationId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AdminAnalyticsController.prototype, "exportCsv", null);
exports.AdminAnalyticsController = AdminAnalyticsController = __decorate([
    (0, swagger_1.ApiTags)('Admin - Analytics'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AdminAnalyticsController);
//# sourceMappingURL=admin-analytics.controller.js.map