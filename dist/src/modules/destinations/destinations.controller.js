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
exports.DestinationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const destinations_service_1 = require("./destinations.service");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const destination_query_dto_1 = require("./dto/destination-query.dto");
const public_decorator_1 = require("../../common/decorators/public.decorator");
let DestinationsController = class DestinationsController {
    destinationsService;
    constructor(destinationsService) {
        this.destinationsService = destinationsService;
    }
    async findAll(query) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        return this.destinationsService.findAll(page, limit, query.search, query.topic_id);
    }
    async getRecommendations(query) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        return this.destinationsService.findRecommendations(page, limit);
    }
    async getRanking(sortBy, limit) {
        const parsedLimit = limit ? parseInt(limit, 10) : 10;
        return this.destinationsService.findRanking(sortBy, parsedLimit);
    }
    async getDetailBySlug(slug) {
        return this.destinationsService.findOnePublicBySlug(slug);
    }
    async getDetail(id) {
        return this.destinationsService.findOnePublic(id);
    }
};
exports.DestinationsController = DestinationsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all destinations with filters' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated list of destinations' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [destination_query_dto_1.DestinationQueryDto]),
    __metadata("design:returntype", Promise)
], DestinationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('recommendations'),
    (0, swagger_1.ApiOperation)({ summary: 'Get recommended destinations' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated list of recommended destinations' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", Promise)
], DestinationsController.prototype, "getRecommendations", null);
__decorate([
    (0, common_1.Get)('ranking'),
    (0, swagger_1.ApiOperation)({ summary: 'Get top destinations ranking' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of top ranked destinations' }),
    __param(0, (0, common_1.Query)('sort_by')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DestinationsController.prototype, "getRanking", null);
__decorate([
    (0, common_1.Get)('slug/:slug'),
    (0, swagger_1.ApiOperation)({ summary: 'Get public destination detail by slug' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Destination detail with analytics' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Destination not found' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DestinationsController.prototype, "getDetailBySlug", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get public destination detail' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Destination detail with analytics' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Destination not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], DestinationsController.prototype, "getDetail", null);
exports.DestinationsController = DestinationsController = __decorate([
    (0, swagger_1.ApiTags)('Public - Destinations'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Controller)('destinations'),
    __metadata("design:paramtypes", [destinations_service_1.DestinationsService])
], DestinationsController);
//# sourceMappingURL=destinations.controller.js.map