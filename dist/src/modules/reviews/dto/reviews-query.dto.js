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
exports.ReviewsQueryDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class ReviewsQueryDto {
    page;
    limit;
    sentiment;
    topic_id;
    date_from;
    date_to;
    sort_by;
    nlp_status;
}
exports.ReviewsQueryDto = ReviewsQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Page number', default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ReviewsQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Number of items per page', default: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ReviewsQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by sentiment', enum: ['positive', 'negative', 'neutral'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEnum)(['positive', 'negative', 'neutral']),
    __metadata("design:type", String)
], ReviewsQueryDto.prototype, "sentiment", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by topic ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ReviewsQueryDto.prototype, "topic_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter reviews from this date (ISO 8601)', example: '2024-01-01' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ReviewsQueryDto.prototype, "date_from", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter reviews until this date (ISO 8601)', example: '2024-12-31' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ReviewsQueryDto.prototype, "date_to", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Sort order based on review date',
        enum: ['newest', 'oldest'],
        default: 'newest',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['newest', 'oldest']),
    __metadata("design:type", String)
], ReviewsQueryDto.prototype, "sort_by", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by NLP processing status',
        enum: ['all', 'processed', 'unprocessed'],
        default: 'all',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['all', 'processed', 'unprocessed']),
    __metadata("design:type", String)
], ReviewsQueryDto.prototype, "nlp_status", void 0);
//# sourceMappingURL=reviews-query.dto.js.map