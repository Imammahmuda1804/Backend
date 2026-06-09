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
exports.NlpController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_express_1 = require("@nestjs/platform-express");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const nlp_upload_service_1 = require("./nlp-upload.service");
const NLP_UPLOAD_FILE_OPTIONS = {
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowedMimes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv',
            'application/octet-stream',
        ];
        const allowedExts = ['.xlsx', '.xls', '.csv'];
        const ext = file.originalname
            .toLowerCase()
            .substring(file.originalname.lastIndexOf('.'));
        if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
            cb(null, true);
            return;
        }
        cb(new common_1.BadRequestException('Hanya file Excel (.xlsx) atau CSV (.csv) yang diperbolehkan'), false);
    },
};
let NlpController = class NlpController {
    nlpUploadService;
    constructor(nlpUploadService) {
        this.nlpUploadService = nlpUploadService;
    }
    preflight(file, destinationIdStr) {
        return this.nlpUploadService.preflight(file, destinationIdStr);
    }
    getHistory(destinationId, status, page = '1', limit = '10') {
        return this.nlpUploadService.getHistory(destinationId, status, page, limit);
    }
    getHistoryDetail(id) {
        return this.nlpUploadService.getHistoryDetail(id);
    }
    uploadAndProcess(file, destinationIdStr, rawMode, adminId) {
        return this.nlpUploadService.uploadAndProcess({
            file,
            destinationIdStr,
            rawMode,
            adminId,
        });
    }
};
exports.NlpController = NlpController;
__decorate([
    (0, common_1.Post)('preflight'),
    (0, common_1.HttpCode)(200),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', NLP_UPLOAD_FILE_OPTIONS)),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({
        summary: 'Cek file NLP sebelum diproses',
        description: 'Membaca file review, menghitung hash file/review, dan mengembalikan jumlah review baru serta duplikat.',
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
                destination_id: { type: 'integer' },
            },
        },
    }),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('destination_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], NlpController.prototype, "preflight", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, swagger_1.ApiOperation)({ summary: 'List riwayat proses NLP admin' }),
    (0, swagger_1.ApiQuery)({ name: 'destination_id', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, common_1.Query)('destination_id')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], NlpController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)('history/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Detail riwayat proses NLP admin' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], NlpController.prototype, "getHistoryDetail", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.HttpCode)(202),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', NLP_UPLOAD_FILE_OPTIONS)),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({
        summary: 'Upload file Excel/CSV dan proses NLP',
        description: 'Upload file hasil scraping dengan dedup review. Mode default skip_existing agar file yang sama tidak membuat review duplikat.',
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
                destination_id: { type: 'integer' },
                mode: {
                    type: 'string',
                    enum: ['skip_existing', 'reprocess_existing', 'replace_existing'],
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 202, description: 'NLP processing berhasil dimulai' }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'File tidak valid atau destinasi tidak ditemukan',
    }),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('destination_id')),
    __param(2, (0, common_1.Body)('mode')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Number]),
    __metadata("design:returntype", void 0)
], NlpController.prototype, "uploadAndProcess", null);
exports.NlpController = NlpController = __decorate([
    (0, swagger_1.ApiTags)('Admin - NLP Processing'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.Controller)('admin/nlp'),
    __metadata("design:paramtypes", [nlp_upload_service_1.NlpUploadService])
], NlpController);
//# sourceMappingURL=nlp.controller.js.map