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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateDestinationDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const destination_categories_1 = require("../destination-categories");
class CreateDestinationDto {
    name;
    description;
    city;
    province;
    category;
    latitude;
    longitude;
    googleMapsUrl;
    youtubeUrl;
    googlePlaceId;
    thumbnailUrl;
    googleRating;
    googleReviewCount;
}
exports.CreateDestinationDto = CreateDestinationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nama destinasi', example: 'Jam Gadang' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDestinationDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Deskripsi', example: 'Ikon wisata...' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDestinationDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Kota', example: 'Bukittinggi' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDestinationDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Provinsi', example: 'Sumatera Barat' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDestinationDto.prototype, "province", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Kategori destinasi',
        enum: destination_categories_1.DESTINATION_CATEGORY_VALUES,
        example: 'alam',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(destination_categories_1.DESTINATION_CATEGORY_VALUES),
    __metadata("design:type", String)
], CreateDestinationDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Latitude', example: -0.305 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateDestinationDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Longitude', example: 100.369 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateDestinationDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Google Maps URL',
        example: 'https://maps.google.com/...',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], CreateDestinationDto.prototype, "googleMapsUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'YouTube Video URL',
        example: 'https://youtube.com/...',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], CreateDestinationDto.prototype, "youtubeUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Google Place ID',
        example: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDestinationDto.prototype, "googlePlaceId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Thumbnail URL. Mendukung URL penuh storage atau path legacy /uploads.',
        example: 'https://project-ref.supabase.co/storage/v1/object/public/ranahinsight-images/destinations/2026-06-10/photo.jpg',
    }),
    (0, class_validator_1.ValidateIf)((_object, value) => value !== undefined && value !== null && value !== ''),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^(https?:\/\/|\/uploads\/)/i, {
        message: 'thumbnailUrl must be a full URL or legacy /uploads path',
    }),
    __metadata("design:type", String)
], CreateDestinationDto.prototype, "thumbnailUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Rating Google Maps (1.0 - 5.0)',
        example: 4.5,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], CreateDestinationDto.prototype, "googleRating", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Jumlah ulasan di Google Maps',
        example: 1200,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateDestinationDto.prototype, "googleReviewCount", void 0);
//# sourceMappingURL=create-destination.dto.js.map