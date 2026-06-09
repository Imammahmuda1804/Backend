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
exports.SearchQueryDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const destination_categories_1 = require("../../destinations/destination-categories");
function emptyStringToUndefined(value) {
    return value === '' ? undefined : value;
}
function parseNumberArray(value) {
    if (value == null || value === '')
        return undefined;
    const parsed = toRawNumberValues(value)
        .map((item) => Number(item))
        .filter(isPositiveInteger);
    return parsed.length > 0 ? parsed : undefined;
}
function toRawNumberValues(value) {
    if (Array.isArray(value))
        return value;
    if (typeof value === 'string' || typeof value === 'number') {
        return String(value).split(',');
    }
    return [];
}
function isPositiveInteger(value) {
    return Number.isInteger(value) && value > 0;
}
class SearchQueryDto {
    query;
    limit = 10;
    sort = 'hybrid';
    city;
    category;
    topic_ids;
    topicIds;
    min_rating;
    minRating;
    sentiment;
}
exports.SearchQueryDto = SearchQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Query pencarian destinasi wisata',
        example: 'wisata keluarga murah di bukittinggi',
        minLength: 3,
        maxLength: 500,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3, { message: 'Query minimal 3 karakter' }),
    (0, class_validator_1.MaxLength)(500, { message: 'Query maksimal 500 karakter' }),
    __metadata("design:type", String)
], SearchQueryDto.prototype, "query", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Jumlah hasil maksimal (default: 10, max: 50)',
        default: 10,
        minimum: 1,
        maximum: 50,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Number)
], SearchQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Mode urutan pencarian semantik (relevance = murni kemiripan teks, hybrid = rekomendasi + rating + sentimen)',
        enum: ['relevance', 'hybrid'],
        default: 'hybrid',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchQueryDto.prototype, "sort", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter kota destinasi',
        example: 'Bukittinggi',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchQueryDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter kategori destinasi',
        enum: destination_categories_1.DESTINATION_CATEGORY_VALUES,
        example: 'alam',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => emptyStringToUndefined(value)),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(destination_categories_1.DESTINATION_CATEGORY_VALUES),
    __metadata("design:type", String)
], SearchQueryDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter ID topik, bisa array atau comma-separated',
        example: '1,2,3',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseNumberArray(value)),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsInt)({ each: true }),
    __metadata("design:type", Array)
], SearchQueryDto.prototype, "topic_ids", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Alias camelCase untuk topic_ids',
        example: [1, 2, 3],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseNumberArray(value)),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsInt)({ each: true }),
    __metadata("design:type", Array)
], SearchQueryDto.prototype, "topicIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Rating minimal destinasi',
        example: 4,
        minimum: 0,
        maximum: 5,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], SearchQueryDto.prototype, "min_rating", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Alias camelCase untuk min_rating',
        example: 4,
        minimum: 0,
        maximum: 5,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], SearchQueryDto.prototype, "minRating", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter sentimen dominan/review',
        enum: ['positive', 'negative', 'neutral'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['positive', 'negative', 'neutral']),
    __metadata("design:type", String)
], SearchQueryDto.prototype, "sentiment", void 0);
//# sourceMappingURL=search-query.dto.js.map