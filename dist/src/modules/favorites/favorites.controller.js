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
exports.FavoritesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const favorites_service_1 = require("./favorites.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let FavoritesController = class FavoritesController {
    favoritesService;
    constructor(favoritesService) {
        this.favoritesService = favoritesService;
    }
    async addFavorite(destinationId, userId) {
        return this.favoritesService.addFavorite(userId, destinationId);
    }
    async getFavorites(userId, page, limit) {
        const parsedPage = page ? parseInt(page, 10) : 1;
        const parsedLimit = limit ? Math.min(parseInt(limit, 10), 100) : 20;
        return this.favoritesService.getFavorites(userId, parsedPage, parsedLimit);
    }
    async removeFavorite(destinationId, userId) {
        return this.favoritesService.removeFavorite(userId, destinationId);
    }
    async checkFavorite(destinationId, userId) {
        return this.favoritesService.checkFavorite(userId, destinationId);
    }
};
exports.FavoritesController = FavoritesController;
__decorate([
    (0, common_1.Post)(':destinationId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Simpan destinasi ke favorites' }),
    (0, swagger_1.ApiParam)({ name: 'destinationId', type: Number }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Berhasil disimpan ke favorites' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Destinasi tidak ditemukan' }),
    __param(0, (0, common_1.Param)('destinationId', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], FavoritesController.prototype, "addFavorite", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Daftar destinasi favorit user' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, example: 20 }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List favorites berhasil diambil' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String]),
    __metadata("design:returntype", Promise)
], FavoritesController.prototype, "getFavorites", null);
__decorate([
    (0, common_1.Delete)(':destinationId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Hapus destinasi dari favorites' }),
    (0, swagger_1.ApiParam)({ name: 'destinationId', type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Berhasil dihapus dari favorites' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Param)('destinationId', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], FavoritesController.prototype, "removeFavorite", null);
__decorate([
    (0, common_1.Get)('check/:destinationId'),
    (0, swagger_1.ApiOperation)({ summary: 'Cek apakah destinasi ada di daftar favorit' }),
    (0, swagger_1.ApiParam)({ name: 'destinationId', type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status favorit berhasil dicek' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, common_1.Param)('destinationId', common_1.ParseIntPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], FavoritesController.prototype, "checkFavorite", null);
exports.FavoritesController = FavoritesController = __decorate([
    (0, swagger_1.ApiTags)('Favorites'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('favorites'),
    __metadata("design:paramtypes", [favorites_service_1.FavoritesService])
], FavoritesController);
//# sourceMappingURL=favorites.controller.js.map