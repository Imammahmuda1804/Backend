import { Logger } from '@nestjs/common';
export declare const FIELD_MAPPING: {
    reviewText: string[];
    reviewDate: string[];
    reviewerName: string[];
    rating: string[];
    likesCount: string[];
    ownerReply: string[];
};
export declare function normalizeKey(key: string): string;
export declare function detectColumnMapping(row: Record<string, unknown>, logger?: Logger): Record<string, string | null>;
export declare class FileParserService {
    parseExcelOrCsv(buffer: Buffer, originalname: string): Record<string, unknown>[];
    validateRows(data: Record<string, unknown>[]): Record<string, unknown>[];
}
