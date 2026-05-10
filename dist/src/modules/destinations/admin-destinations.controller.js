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
exports.AdminDestinationsController = exports.ScrapeDestinationDto = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const destinations_service_1 = require("./destinations.service");
const scraper_service_1 = require("../scraper/scraper.service");
const dto_1 = require("../scraper/dto");
const multer_config_1 = require("../../config/multer.config");
const dto_2 = require("./dto");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
class ScrapeDestinationDto extends (0, swagger_1.OmitType)(dto_1.StartScrapingDto, [
    'destination_id',
]) {
}
exports.ScrapeDestinationDto = ScrapeDestinationDto;
let AdminDestinationsController = class AdminDestinationsController {
    destinationsService;
    scraperService;
    constructor(destinationsService, scraperService) {
        this.destinationsService = destinationsService;
        this.scraperService = scraperService;
    }
    async create(dto) {
        return this.destinationsService.create(dto);
    }
    async findAll(query) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        return this.destinationsService.findAll(page, limit, query.search, query.topic_id);
    }
    async findOne(id) {
        return this.destinationsService.findOneAdmin(id);
    }
    async update(id, dto) {
        return this.destinationsService.update(id, dto);
    }
    async softDelete(id) {
        return this.destinationsService.softDelete(id);
    }
    async updateMapsUrl(id, dto) {
        return this.destinationsService.updateMapsUrl(id, dto);
    }
    async uploadThumbnail(id, file) {
        if (!file) {
            throw new common_1.BadRequestException('File is required');
        }
        return this.destinationsService.uploadThumbnail(id, file.filename);
    }
    async uploadImage(id, file) {
        if (!file) {
            throw new common_1.BadRequestException('File is required');
        }
        return this.destinationsService.uploadImage(id, file.filename);
    }
    async deleteImage(imageId) {
        return this.destinationsService.deleteImage(imageId);
    }
    async scrapeDestination(id, dto, req) {
        const adminId = req.user?.id;
        const scrapeDto = new dto_1.StartScrapingDto();
        Object.assign(scrapeDto, dto);
        scrapeDto.destination_id = id;
        return this.scraperService.startScraping(scrapeDto, adminId);
    }
};
exports.AdminDestinationsController = AdminDestinationsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Membuat destinasi baru' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Destination created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation failed' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — ADMIN only' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_2.CreateDestinationDto]),
    __metadata("design:returntype", Promise)
], AdminDestinationsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mendapatkan daftar destinasi (paginated)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Paginated list of destinations' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — ADMIN only' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_2.DestinationQueryDto]),
    __metadata("design:returntype", Promise)
], AdminDestinationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Mendapatkan detail destinasi (dengan relasi analitik)',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Destination detail with analytics' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — ADMIN only' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Destination not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminDestinationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Mengedit data destinasi' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Destination updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation failed' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — ADMIN only' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Destination not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, dto_2.UpdateDestinationDto]),
    __metadata("design:returntype", Promise)
], AdminDestinationsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Soft delete destinasi' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Destination soft deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — ADMIN only' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Destination not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminDestinationsController.prototype, "softDelete", null);
__decorate([
    (0, common_1.Put)(':id/maps-url'),
    (0, swagger_1.ApiOperation)({ summary: 'Update Google Maps URL destinasi' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Maps URL updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation failed' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — ADMIN only' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Destination not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, dto_2.UpdateMapsUrlDto]),
    __metadata("design:returntype", Promise)
], AdminDestinationsController.prototype, "updateMapsUrl", null);
__decorate([
    (0, common_1.Post)(':id/thumbnail'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload destination thumbnail (cover image)' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Thumbnail uploaded successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'File is required or invalid format' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Destination not found' }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', multer_config_1.multerImageOptions)),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AdminDestinationsController.prototype, "uploadThumbnail", null);
__decorate([
    (0, common_1.Post)(':id/images'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload destination gallery image' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Image uploaded successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'File is required or invalid format' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — ADMIN only' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Destination not found' }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', multer_config_1.multerImageOptions)),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AdminDestinationsController.prototype, "uploadImage", null);
__decorate([
    (0, common_1.Delete)('images/:imageId'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete destination gallery image' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Image deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — ADMIN only' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Image not found' }),
    __param(0, (0, common_1.Param)('imageId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminDestinationsController.prototype, "deleteImage", null);
__decorate([
    (0, common_1.Post)(':id/scrape'),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    (0, swagger_1.ApiOperation)({
        summary: 'Trigger scraping reviews langsung dari halaman destination',
    }),
    (0, swagger_1.ApiResponse)({ status: 202, description: 'Scraping job started' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation failed' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — ADMIN only' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Destination not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, ScrapeDestinationDto, Object]),
    __metadata("design:returntype", Promise)
], AdminDestinationsController.prototype, "scrapeDestination", null);
exports.AdminDestinationsController = AdminDestinationsController = __decorate([
    (0, swagger_1.ApiTags)('Admin - Destinations'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.Controller)('admin/destinations'),
    __metadata("design:paramtypes", [destinations_service_1.DestinationsService,
        scraper_service_1.ScraperService])
], AdminDestinationsController);
//# sourceMappingURL=admin-destinations.controller.js.map