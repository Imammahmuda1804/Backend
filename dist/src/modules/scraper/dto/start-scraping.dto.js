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
exports.StartScrapingDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class StartScrapingDto {
    destination_id;
    max_reviews = 100;
    maps_url;
}
exports.StartScrapingDto = StartScrapingDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID destinasi yang akan di-scraping' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], StartScrapingDto.prototype, "destination_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Jumlah maksimal ulasan yang diambil (default: 100). Kosongkan untuk ambil semua.',
        default: 100,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], StartScrapingDto.prototype, "max_reviews", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'URL Google Maps kustom. Jika diisi, akan menggantikan URL yang tersimpan di data destinasi.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StartScrapingDto.prototype, "maps_url", void 0);
//# sourceMappingURL=start-scraping.dto.js.map