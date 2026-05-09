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
exports.PaginatedResponseDto = exports.PaginationMeta = void 0;
const swagger_1 = require("@nestjs/swagger");
class PaginationMeta {
    page;
    limit;
    totalItems;
    totalPages;
    hasPreviousPage;
    hasNextPage;
}
exports.PaginationMeta = PaginationMeta;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Halaman saat ini' }),
    __metadata("design:type", Number)
], PaginationMeta.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Jumlah item per halaman' }),
    __metadata("design:type", Number)
], PaginationMeta.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total item keseluruhan' }),
    __metadata("design:type", Number)
], PaginationMeta.prototype, "totalItems", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total halaman' }),
    __metadata("design:type", Number)
], PaginationMeta.prototype, "totalPages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Apakah ada halaman sebelumnya' }),
    __metadata("design:type", Boolean)
], PaginationMeta.prototype, "hasPreviousPage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Apakah ada halaman selanjutnya' }),
    __metadata("design:type", Boolean)
], PaginationMeta.prototype, "hasNextPage", void 0);
class PaginatedResponseDto {
    data;
    meta;
    constructor(data, totalItems, page, limit) {
        const totalPages = Math.ceil(totalItems / limit);
        this.data = data;
        this.meta = {
            page,
            limit,
            totalItems,
            totalPages,
            hasPreviousPage: page > 1,
            hasNextPage: page < totalPages,
        };
    }
}
exports.PaginatedResponseDto = PaginatedResponseDto;
//# sourceMappingURL=paginated-response.dto.js.map