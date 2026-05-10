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
exports.TopicsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const topics_service_1 = require("./topics.service");
const public_decorator_1 = require("../../common/decorators/public.decorator");
let TopicsController = class TopicsController {
    topicsService;
    constructor(topicsService) {
        this.topicsService = topicsService;
    }
    async findAll() {
        return this.topicsService.findAll();
    }
    async findDestinationsByTopic(id, page, limit) {
        const parsedPage = page ? parseInt(page, 10) : 1;
        const parsedLimit = limit ? Math.min(parseInt(limit, 10), 100) : 10;
        return this.topicsService.findDestinationsByTopic(id, parsedPage, parsedLimit);
    }
};
exports.TopicsController = TopicsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List semua topics dengan jumlah destinasi' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Topics berhasil diambil' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TopicsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id/destinations'),
    (0, swagger_1.ApiOperation)({ summary: 'Destinasi berdasarkan topic' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: Number, description: 'Topic ID' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, example: 10 }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Destinations berhasil diambil' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Topic tidak ditemukan' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String]),
    __metadata("design:returntype", Promise)
], TopicsController.prototype, "findDestinationsByTopic", null);
exports.TopicsController = TopicsController = __decorate([
    (0, swagger_1.ApiTags)('Topics'),
    (0, public_decorator_1.Public)(),
    (0, common_1.Controller)('topics'),
    __metadata("design:paramtypes", [topics_service_1.TopicsService])
], TopicsController);
//# sourceMappingURL=topics.controller.js.map