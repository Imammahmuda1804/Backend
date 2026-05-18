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
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const analytics_service_1 = require("./analytics.service");
const dto_1 = require("./dto");
const public_decorator_1 = require("../../common/decorators/public.decorator");
let AnalyticsController = class AnalyticsController {
    analyticsService;
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    async getDashboard() {
        return this.analyticsService.getPublicDashboard();
    }
    async getDestinationAnalytics(id) {
        return this.analyticsService.getDestinationAnalytics(id);
    }
    async getDestinationTopics(id) {
        return this.analyticsService.getDestinationTopics(id);
    }
    async getDestinationTrends(id, query) {
        return this.analyticsService.getDestinationTrends(id, query.period);
    }
    async compareDestinations(query) {
        return this.analyticsService.compareDestinations(query.destination1, query.destination2);
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Public analytics dashboard' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dashboard stats berhasil diambil' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('destination/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Analytics lengkap untuk satu destinasi' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Analytics berhasil diambil' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Destinasi tidak ditemukan' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getDestinationAnalytics", null);
__decorate([
    (0, common_1.Get)('destination/:id/topics'),
    (0, swagger_1.ApiOperation)({ summary: 'Topic distribution untuk satu destinasi' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Topic distribution berhasil diambil',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Destinasi tidak ditemukan' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getDestinationTopics", null);
__decorate([
    (0, common_1.Get)('trends/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Trend sentimen untuk satu destinasi' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiQuery)({
        name: 'period',
        required: false,
        enum: ['daily', 'weekly', 'monthly'],
        description: 'Periode agregasi trend',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Trend data berhasil diambil' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Destinasi tidak ditemukan' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, dto_1.TrendsQueryDto]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getDestinationTrends", null);
__decorate([
    (0, common_1.Get)('compare'),
    (0, swagger_1.ApiOperation)({ summary: 'Perbandingan dua destinasi' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Perbandingan berhasil' }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Salah satu destinasi tidak ditemukan',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CompareQueryDto]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "compareDestinations", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, swagger_1.ApiTags)('Analytics - Public'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Controller)('analytics'),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map