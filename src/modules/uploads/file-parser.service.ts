import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as xlsx from 'xlsx';

export const FIELD_MAPPING = {
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

export function normalizeKey(key: string): string {
  return key.toLowerCase().trim().replace(/[\s\-]/g, '_');
}

export function detectColumnMapping(row: Record<string, unknown>, logger?: Logger): Record<string, string | null> {
  const mapping: Record<string, string | null> = {};
  const usedKeys = new Set<string>();
  
  const normalizedKeys = Object.keys(row).map(k => ({
    original: k,
    normalized: normalizeKey(k)
  }));

  const findMatch = (canonicalNames: string[]) => {
    for (const name of canonicalNames) {
      const match = normalizedKeys.find(k => k.normalized === name && !usedKeys.has(k.original));
      if (match) {
        usedKeys.add(match.original);
        return match.original;
      }
    }
    return null;
  };

  mapping.reviewText = findMatch(FIELD_MAPPING.reviewText);
  mapping.reviewDate = findMatch(FIELD_MAPPING.reviewDate);
  mapping.reviewerName = findMatch(FIELD_MAPPING.reviewerName);
  mapping.rating = findMatch(FIELD_MAPPING.rating);
  mapping.likesCount = findMatch(FIELD_MAPPING.likesCount);
  mapping.ownerReply = findMatch(FIELD_MAPPING.ownerReply);

  if (logger) {
    logger.log(`Detected Column Mapping: ${JSON.stringify(mapping)}`);
    if (!mapping.reviewText) {
      logger.warn('Warning: Mandatory column "reviewText" not found in the file headers.');
    }
  }

  return mapping;
}

@Injectable()
export class FileParserService {
  parseExcelOrCsv(buffer: Buffer, originalname: string): any[] {
    const ext = originalname.split('.').pop()?.toLowerCase();

    if (ext !== 'csv' && ext !== 'xlsx' && ext !== 'xls') {
      throw new BadRequestException(
        'Format file tidak didukung. Gunakan CSV, XLSX, atau XLS.',
      );
    }

    try {
      const workbook = xlsx.read(buffer, { type: 'buffer', cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      return xlsx.utils.sheet_to_json(sheet);
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
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

    const firstRow = data[0] as Record<string, unknown>;
    const mapping = detectColumnMapping(firstRow);

    if (!mapping.reviewText) {
      throw new BadRequestException(
        'File tidak memiliki kolom yang merepresentasikan teks review. ' +
        'Kolom yang valid: "Teks Ulasan", "review_text", "text", "content", "ulasan", dll.',
      );
    }

    return data;
  }
}
