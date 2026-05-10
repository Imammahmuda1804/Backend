"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileParserService = void 0;
const common_1 = require("@nestjs/common");
const xlsx = __importStar(require("xlsx"));
let FileParserService = class FileParserService {
    parseExcelOrCsv(buffer, originalname) {
        const ext = originalname.split('.').pop()?.toLowerCase();
        try {
            if (ext === 'csv') {
                const workbook = xlsx.read(buffer, { type: 'buffer', raw: true });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                return xlsx.utils.sheet_to_json(sheet);
            }
            else if (ext === 'xlsx' || ext === 'xls') {
                const workbook = xlsx.read(buffer, { type: 'buffer' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                return xlsx.utils.sheet_to_json(sheet);
            }
            else {
                throw new common_1.BadRequestException('Format file tidak didukung. Gunakan CSV, XLSX, atau XLS.');
            }
        }
        catch {
            throw new common_1.BadRequestException('Gagal mem-parsing file. Pastikan file tidak rusak dan formatnya benar.');
        }
    }
    validateRows(data) {
        if (!data || data.length === 0) {
            throw new common_1.BadRequestException('File kosong atau tidak memiliki baris data.');
        }
        if (data.length > 50000) {
            throw new common_1.BadRequestException('Jumlah baris melebihi batas maksimal 50.000 baris.');
        }
        const firstRow = data[0];
        const columns = Object.keys(firstRow).map((k) => k.toLowerCase());
        const hasReviewText = columns.some((c) => c.includes('text') ||
            c.includes('review') ||
            c.includes('content') ||
            c.includes('ulasan') ||
            c.includes('teks') ||
            c.includes('komentar'));
        if (!hasReviewText) {
            throw new common_1.BadRequestException('File tidak memiliki kolom yang merepresentasikan teks review. ' +
                'Kolom yang valid: "Teks Ulasan", "review_text", "text", "content", "ulasan", dll.');
        }
        return data;
    }
};
exports.FileParserService = FileParserService;
exports.FileParserService = FileParserService = __decorate([
    (0, common_1.Injectable)()
], FileParserService);
//# sourceMappingURL=file-parser.service.js.map