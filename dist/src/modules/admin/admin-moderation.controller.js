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
exports.AdminModerationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const reviews_service_1 = require("../reviews/reviews.service");
const analytics_service_1 = require("../analytics/analytics.service");
let AdminModerationController = class AdminModerationController {
    reviewsService;
    analyticsService;
    constructor(reviewsService, analyticsService) {
        this.reviewsService = reviewsService;
        this.analyticsService = analyticsService;
    }
    async deleteReview(id) {
        return this.reviewsService.deleteReview(id);
    }
    async deleteUserReview(id) {
        return this.reviewsService.deleteUserReview(id);
    }
    async recalculateAnalytics(destinationId) {
        return this.analyticsService.recalculateAnalytics(destinationId);
    }
};
exports.AdminModerationController = AdminModerationController;
__decorate([
    (0, common_1.Delete)('moderation/reviews/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Hapus scraped review (moderasi)' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Review berhasil dihapus' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — ADMIN only' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Review tidak ditemukan' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminModerationController.prototype, "deleteReview", null);
__decorate([
    (0, common_1.Delete)('user-reviews/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Hapus user review (moderasi)' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User review berhasil dihapus' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — ADMIN only' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User review tidak ditemukan' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminModerationController.prototype, "deleteUserReview", null);
__decorate([
    (0, common_1.Post)('analytics/recalculate/:destinationId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Recalculate semua analytics untuk destinasi',
        description: 'Menghitung ulang: positive_ratio, recommendation_score, ' +
            'destination_topics, sentiment_trends, user_rating.',
    }),
    (0, swagger_1.ApiParam)({ name: 'destinationId', type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Analytics berhasil direcalculate' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — ADMIN only' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Destinasi tidak ditemukan' }),
    __param(0, (0, common_1.Param)('destinationId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminModerationController.prototype, "recalculateAnalytics", null);
exports.AdminModerationController = AdminModerationController = __decorate([
    (0, swagger_1.ApiTags)('Admin - Moderation'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [reviews_service_1.ReviewsService,
        analytics_service_1.AnalyticsService])
], AdminModerationController);
//# sourceMappingURL=admin-moderation.controller.js.map