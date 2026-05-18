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
exports.DestinationListDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class DestinationListDto {
    id;
    name;
    slug;
    city;
    province;
    thumbnailUrl;
    googleRating;
    userRating;
    positiveRatio;
    recommendationScore;
}
exports.DestinationListDto = DestinationListDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID destinasi', example: 1 }),
    __metadata("design:type", Number)
], DestinationListDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nama destinasi', example: 'Jam Gadang' }),
    __metadata("design:type", String)
], DestinationListDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'URL-friendly slug', example: 'jam-gadang' }),
    __metadata("design:type", String)
], DestinationListDto.prototype, "slug", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Kota lokasi destinasi', example: 'Bukittinggi' }),
    __metadata("design:type", String)
], DestinationListDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Provinsi lokasi destinasi',
        example: 'Sumatera Barat',
    }),
    __metadata("design:type", String)
], DestinationListDto.prototype, "province", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'URL thumbnail image',
        nullable: true,
        example: 'https://example.com/image.jpg',
    }),
    __metadata("design:type", Object)
], DestinationListDto.prototype, "thumbnailUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Rating dari Google Maps (1-5)',
        nullable: true,
        example: 4.5,
    }),
    __metadata("design:type", Object)
], DestinationListDto.prototype, "googleRating", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Rating dari user aplikasi (1-5)',
        nullable: true,
        example: 4.2,
    }),
    __metadata("design:type", Object)
], DestinationListDto.prototype, "userRating", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Rasio review positif (0-1)',
        nullable: true,
        example: 0.85,
    }),
    __metadata("design:type", Object)
], DestinationListDto.prototype, "positiveRatio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Skor rekomendasi (0-100)',
        nullable: true,
        example: 87.5,
    }),
    __metadata("design:type", Object)
], DestinationListDto.prototype, "recommendationScore", void 0);
//# sourceMappingURL=destination-list.dto.js.map