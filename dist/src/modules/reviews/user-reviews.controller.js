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
exports.UserReviewsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const reviews_service_1 = require("./reviews.service");
const dto_1 = require("./dto");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let UserReviewsController = class UserReviewsController {
    reviewsService;
    constructor(reviewsService) {
        this.reviewsService = reviewsService;
    }
    async createReview(dto, userId) {
        return this.reviewsService.createUserReview(userId, dto);
    }
};
exports.UserReviewsController = UserReviewsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Buat review dan rating untuk destinasi',
        description: 'User memberikan rating (1-5) dan review text (opsional) untuk destinasi. ' +
            'Rating destinasi akan direcalculate otomatis.',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Review berhasil dibuat' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validasi gagal (rating 1-5)' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Destinasi tidak ditemukan' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateUserReviewDto, Number]),
    __metadata("design:returntype", Promise)
], UserReviewsController.prototype, "createReview", null);
exports.UserReviewsController = UserReviewsController = __decorate([
    (0, swagger_1.ApiTags)('User Reviews'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('user-reviews'),
    __metadata("design:paramtypes", [reviews_service_1.ReviewsService])
], UserReviewsController);
//# sourceMappingURL=user-reviews.controller.js.map