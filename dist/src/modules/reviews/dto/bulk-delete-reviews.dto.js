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
exports.BulkDeleteReviewsDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class BulkDeleteReviewsDto {
    destinationId;
    category;
}
exports.BulkDeleteReviewsDto = BulkDeleteReviewsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID Destinasi', example: 1 }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], BulkDeleteReviewsDto.prototype, "destinationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Kategori penghapusan',
        enum: ['all', 'processed', 'unprocessed'],
        example: 'unprocessed',
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(['all', 'processed', 'unprocessed']),
    __metadata("design:type", String)
], BulkDeleteReviewsDto.prototype, "category", void 0);
//# sourceMappingURL=bulk-delete-reviews.dto.js.map