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
exports.AdminReviewsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const reviews_service_1 = require("./reviews.service");
const reviews_query_dto_1 = require("./dto/reviews-query.dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
let AdminReviewsController = class AdminReviewsController {
    reviewsService;
    constructor(reviewsService) {
        this.reviewsService = reviewsService;
    }
    async getReviewsByDestination(destinationId, query) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        return this.reviewsService.getReviewsByDestination(destinationId, page, limit, query.sentiment, query.topic_id, query.date_from, query.date_to, query.sort_by, query.nlp_status);
    }
    async deleteBulkReviews(destinationId, category) {
        return this.reviewsService.deleteBulkReviews(destinationId, category);
    }
    async deleteReview(id) {
        return this.reviewsService.deleteReview(id);
    }
};
exports.AdminReviewsController = AdminReviewsController;
__decorate([
    (0, common_1.Get)('destination/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan daftar review untuk sebuah destinasi' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Daftar review berhasil diambil' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — ADMIN only' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, reviews_query_dto_1.ReviewsQueryDto]),
    __metadata("design:returntype", Promise)
], AdminReviewsController.prototype, "getReviewsByDestination", null);
__decorate([
    (0, common_1.Delete)('destination/:id/bulk'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Menghapus review secara masal (Bulk Delete)' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Review berhasil dihapus secara masal',
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — ADMIN only' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], AdminReviewsController.prototype, "deleteBulkReviews", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Menghapus review (scraped review)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Review berhasil dihapus' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — ADMIN only' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Review tidak ditemukan' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminReviewsController.prototype, "deleteReview", null);
exports.AdminReviewsController = AdminReviewsController = __decorate([
    (0, swagger_1.ApiTags)('Admin - Reviews'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.Controller)('admin/reviews'),
    __metadata("design:paramtypes", [reviews_service_1.ReviewsService])
], AdminReviewsController);
//# sourceMappingURL=admin-reviews.controller.js.map