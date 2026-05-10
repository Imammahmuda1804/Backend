import { Injectable, BadRequestException } from '@nestjs/common';
import * as xlsx from 'xlsx';

@Injectable()
export class FileParserService {
  parseExcelOrCsv(buffer: Buffer, originalname: string): any[] {
    const ext = originalname.split('.').pop()?.toLowerCase();

    try {
      if (ext === 'csv') {
        const workbook = xlsx.read(buffer, { type: 'buffer', raw: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        return xlsx.utils.sheet_to_json(sheet);
      } else if (ext === 'xlsx' || ext === 'xls') {
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        return xlsx.utils.sheet_to_json(sheet);
      } else {
        throw new BadRequestException(
          'Format file tidak didukung. Gunakan CSV, XLSX, atau XLS.',
        );
      }
    } catch {
      throw new BadRequestException(
        'Gagal mem-parsing file. Pastikan file tidak rusak dan formatnya benar.',
      );
    }
  }

  validateRows(data: any[]): any[] {
    if (!data || data.length === 0) {
      throw new BadRequestException(
        'File kosong atau tidak memiliki baris data.',
      );
    }

    if (data.length > 50000) {
      throw new BadRequestException(
        'Jumlah baris melebihi batas maksimal 50.000 baris.',
      );
    }

    // Required columns validation
    const firstRow = data[0] as Record<string, unknown>;
    const columns = Object.keys(firstRow).map((k) => k.toLowerCase());

    // Check for review text column (English or Indonesian)
    const hasReviewText = columns.some(
      (c) =>
        c.includes('text') ||
        c.includes('review') ||
        c.includes('content') ||
        c.includes('ulasan') ||
        c.includes('teks') ||
        c.includes('komentar'),
    );

    if (!hasReviewText) {
      throw new BadRequestException(
        'File tidak memiliki kolom yang merepresentasikan teks review. ' +
        'Kolom yang valid: "Teks Ulasan", "review_text", "text", "content", "ulasan", dll.',
      );
    }

    return data;
  }
}
