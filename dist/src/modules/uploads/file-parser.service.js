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
exports.FileParserService = exports.FIELD_MAPPING = void 0;
exports.normalizeKey = normalizeKey;
exports.detectColumnMapping = detectColumnMapping;
const common_1 = require("@nestjs/common");
const xlsx = __importStar(require("xlsx"));
exports.FIELD_MAPPING = {
    reviewText: [
        'teks_ulasan', 'review_text', 'reviewtext', 'text', 'content', 'komentar', 'review', 'ulasan'
    ],
    reviewDate: [
        'tanggal_ulasan', 'review_date', 'reviewdate', 'published_at', 'publishedatdate', 'date', 'tanggal', 'time', 'waktu'
    ],
    reviewerName: [
        'nama_pengulas', 'reviewer_name', 'reviewername', 'name', 'author', 'user', 'nama', 'penulis'
    ],
    rating: [
        'rating', 'stars', 'star', 'score', 'bintang', 'nilai'
    ],
    likesCount: [
        'jumlah_suka', 'likes_count', 'likescount', 'likes', 'like', 'helpful', 'suka', 'berguna'
    ],
    ownerReply: [
        'balasan_pemilik', 'owner_reply', 'responsefromownertext', 'response', 'balasan'
    ]
};
function normalizeKey(key) {
    return key.toLowerCase().trim().replace(/[\s\-]/g, '_');
}
function detectColumnMapping(row, logger) {
    const mapping = {};
    const usedKeys = new Set();
    const normalizedKeys = Object.keys(row).map(k => ({
        original: k,
        normalized: normalizeKey(k)
    }));
    const findMatch = (canonicalNames) => {
        for (const name of canonicalNames) {
            const match = normalizedKeys.find(k => k.normalized === name && !usedKeys.has(k.original));
            if (match) {
                usedKeys.add(match.original);
                return match.original;
            }
        }
        return null;
    };
    mapping.reviewText = findMatch(exports.FIELD_MAPPING.reviewText);
    mapping.reviewDate = findMatch(exports.FIELD_MAPPING.reviewDate);
    mapping.reviewerName = findMatch(exports.FIELD_MAPPING.reviewerName);
    mapping.rating = findMatch(exports.FIELD_MAPPING.rating);
    mapping.likesCount = findMatch(exports.FIELD_MAPPING.likesCount);
    mapping.ownerReply = findMatch(exports.FIELD_MAPPING.ownerReply);
    if (logger) {
        logger.log(`Detected Column Mapping: ${JSON.stringify(mapping)}`);
        if (!mapping.reviewText) {
            logger.warn('Warning: Mandatory column "reviewText" not found in the file headers.');
        }
    }
    return mapping;
}
let FileParserService = class FileParserService {
    parseExcelOrCsv(buffer, originalname) {
        const ext = originalname.split('.').pop()?.toLowerCase();
        if (ext !== 'csv' && ext !== 'xlsx' && ext !== 'xls') {
            throw new common_1.BadRequestException('Format file tidak didukung. Gunakan CSV, XLSX, atau XLS.');
        }
        try {
            const workbook = xlsx.read(buffer, { type: 'buffer', cellDates: true });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            return xlsx.utils.sheet_to_json(sheet);
        }
        catch (err) {
            if (err instanceof common_1.BadRequestException)
                throw err;
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
        const mapping = detectColumnMapping(firstRow);
        if (!mapping.reviewText) {
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