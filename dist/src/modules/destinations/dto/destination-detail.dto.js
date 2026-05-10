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
exports.DestinationDetailDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const destination_list_dto_1 = require("./destination-list.dto");
class DestinationDetailDto extends destination_list_dto_1.DestinationListDto {
    description;
    latitude;
    longitude;
    googleMapsUrl;
    youtubeUrl;
    images;
    topics;
    sentimentTrends;
}
exports.DestinationDetailDto = DestinationDetailDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Deskripsi lengkap destinasi', nullable: true, example: 'Jam Gadang adalah menara jam ikonik di Bukittinggi' }),
    __metadata("design:type", Object)
], DestinationDetailDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Latitude koordinat', nullable: true, example: -0.3055 }),
    __metadata("design:type", Object)
], DestinationDetailDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Longitude koordinat', nullable: true, example: 100.3693 }),
    __metadata("design:type", Object)
], DestinationDetailDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'URL Google Maps', nullable: true, example: 'https://maps.google.com/?cid=123' }),
    __metadata("design:type", Object)
], DestinationDetailDto.prototype, "googleMapsUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'URL video YouTube', nullable: true, example: 'https://youtube.com/watch?v=abc' }),
    __metadata("design:type", Object)
], DestinationDetailDto.prototype, "youtubeUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Gallery images', type: 'array', items: { type: 'object' } }),
    __metadata("design:type", Array)
], DestinationDetailDto.prototype, "images", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Topics terkait destinasi', type: 'array', items: { type: 'object' } }),
    __metadata("design:type", Array)
], DestinationDetailDto.prototype, "topics", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Trend sentimen dari waktu ke waktu', type: 'array', items: { type: 'object' } }),
    __metadata("design:type", Array)
], DestinationDetailDto.prototype, "sentimentTrends", void 0);
//# sourceMappingURL=destination-detail.dto.js.map