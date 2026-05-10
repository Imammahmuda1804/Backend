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
var SearchController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const search_service_1 = require("./search.service");
const dto_1 = require("./dto");
const optional_jwt_auth_guard_1 = require("../../common/guards/optional-jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let SearchController = SearchController_1 = class SearchController {
    searchService;
    logger = new common_1.Logger(SearchController_1.name);
    constructor(searchService) {
        this.searchService = searchService;
    }
    async search(dto, req) {
        const userId = req?.user?.id;
        this.logger.log(`🔍 Search endpoint called`);
        this.logger.log(`   Query: "${dto.query}"`);
        this.logger.log(`   req.user: ${JSON.stringify(req?.user)}`);
        this.logger.log(`   userId extracted: ${userId}`);
        return this.searchService.semanticSearch(dto, userId);
    }
    async getHistory(userId, page, limit) {
        const parsedPage = page ? parseInt(page, 10) : 1;
        const parsedLimit = limit ? Math.min(parseInt(limit, 10), 100) : 20;
        return this.searchService.getHistory(userId, parsedPage, parsedLimit);
    }
    async clearHistory(userId) {
        return this.searchService.clearHistory(userId);
    }
    async deleteHistoryEntry(id, userId) {
        return this.searchService.deleteHistoryEntry(id, userId);
    }
};
exports.SearchController = SearchController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Semantic search destinasi wisata',
        description: 'Cari destinasi menggunakan natural language query. ' +
            'Bisa diakses tanpa login. Jika login, riwayat pencarian akan disimpan otomatis.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Hasil pencarian berhasil' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Query tidak valid (min 3 karakter)' }),
    (0, swagger_1.ApiResponse)({ status: 503, description: 'NLP service tidak tersedia' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.SearchQueryDto, Object]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Riwayat pencarian user yang sedang login' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, example: 20 }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Riwayat pencarian berhasil diambil' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Delete)('history'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Hapus semua riwayat pencarian user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Semua riwayat berhasil dihapus' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "clearHistory", null);
__decorate([
    (0, common_1.Delete)('history/:id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Hapus satu entry riwayat pencarian' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Entry berhasil dihapus' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — bukan milik user ini' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Entry tidak ditemukan' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "deleteHistoryEntry", null);
exports.SearchController = SearchController = SearchController_1 = __decorate([
    (0, swagger_1.ApiTags)('Search'),
    (0, common_1.Controller)('search'),
    __metadata("design:paramtypes", [search_service_1.SearchService])
], SearchController);
//# sourceMappingURL=search.controller.js.map