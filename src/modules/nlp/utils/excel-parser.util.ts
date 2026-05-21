import { BadRequestException, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

export interface ParsedReview {
  reviewerName: string;
  reviewText: string;
  rating: number | null;
  reviewDate: string;
  likesCount: number;
  ownerReply: string | null;
}

export interface ColumnMap {
  reviewerName: number | null;
  reviewText: number | null;
  rating: number | null;
  reviewDate: number | null;
  likesCount: number | null;
  ownerReply: number | null;
}

export class ExcelParserUtil {
  private static readonly logger = new Logger(ExcelParserUtil.name);

  // Membaca file Excel atau CSV hasil scraping.
  public static async parseUploadedFile(
    file: Express.Multer.File,
  ): Promise<ParsedReview[]> {
    const ext = file.originalname
      .toLowerCase()
      .substring(file.originalname.lastIndexOf('.'));

    if (ext === '.xlsx' || ext === '.xls') {
      return this.parseExcel(file.buffer);
    } else if (ext === '.csv') {
      return this.parseCsv(file.buffer);
    }

    throw new BadRequestException('Format file tidak didukung');
  }

  private static async parseExcel(buffer: Buffer): Promise<ParsedReview[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

    const sheet = workbook.getWorksheet(1);
    if (!sheet) {
      throw new BadRequestException('File Excel tidak memiliki worksheet');
    }

    const reviews: ParsedReview[] = [];
    const headerRow = sheet.getRow(1);
    const headers: Record<number, string> = {};

    headerRow.eachCell((cell, colNumber) => {
      const val = this.stringifyCellValue(cell.value).trim().toLowerCase();
      headers[colNumber] = val;
    });

    this.logger.log(`📋 Raw Excel headers: ${JSON.stringify(headers)}`);

    const colMap = this.buildColumnMap(headers);
    this.logger.log(`📋 Column map result: ${JSON.stringify(colMap)}`);

    let isFirstDataRow = true;
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header

      const reviewText = this.getCellString(row, colMap.reviewText);
      const rating = this.getCellNumber(row, colMap.rating);
      const reviewerName =
        this.getCellString(row, colMap.reviewerName) || 'Anonymous';
      const reviewDate = this.getCellString(row, colMap.reviewDate);
      const likesCount = this.getCellNumber(row, colMap.likesCount) || 0;
      const ownerReply = this.getCellString(row, colMap.ownerReply);

      if (isFirstDataRow) {
        this.logger.log(`📋 Row ${rowNumber} sample data:`);
        this.logger.log(
          `   reviewText (col ${colMap.reviewText}): "${(reviewText || '').substring(0, 80)}"`,
        );
        this.logger.log(
          `   reviewDate (col ${colMap.reviewDate}): "${reviewDate}"`,
        );
        this.logger.log(
          `   reviewerName (col ${colMap.reviewerName}): "${reviewerName}"`,
        );
        this.logger.log(`   rating (col ${colMap.rating}): ${rating}`);
        isFirstDataRow = false;
      }

      // Hanya tambahkan jika ada teks ulasan
      if (reviewText && reviewText.trim().length > 0) {
        reviews.push({
          reviewerName,
          reviewText,
          rating,
          reviewDate,
          likesCount,
          ownerReply,
        });
      }
    });

    return reviews;
  }

  private static parseCsv(buffer: Buffer): ParsedReview[] {
    const content = buffer.toString('utf-8');
    const lines = content.split('\n').filter((l) => l.trim().length > 0);

    if (lines.length < 2) {
      throw new BadRequestException('File CSV kosong atau tidak valid');
    }

    const headerLine = lines[0];
    const headerParts = this.parseCsvLine(headerLine);
    const headers: Record<number, string> = {};
    headerParts.forEach((h, i) => {
      headers[i + 1] = h.trim().toLowerCase();
    });

    const colMap = this.buildColumnMap(headers);
    const reviews: ParsedReview[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = this.parseCsvLine(lines[i]);
      const getCellStr = (col: number | null) =>
        col !== null && parts[col - 1] ? parts[col - 1].trim() : '';
      const getCellNum = (col: number | null) => {
        const val = getCellStr(col);
        const num = parseInt(val, 10);
        return isNaN(num) ? null : num;
      };

      const reviewText = getCellStr(colMap.reviewText);
      if (reviewText && reviewText.length > 0) {
        reviews.push({
          reviewerName: getCellStr(colMap.reviewerName) || 'Anonymous',
          reviewText,
          rating: getCellNum(colMap.rating),
          reviewDate: getCellStr(colMap.reviewDate),
          likesCount: getCellNum(colMap.likesCount) || 0,
          ownerReply: getCellStr(colMap.ownerReply),
        });
      }
    }

    return reviews;
  }

  private static buildColumnMap(headers: Record<number, string>): ColumnMap {
    const map: ColumnMap = {
      reviewerName: null,
      reviewText: null,
      rating: null,
      reviewDate: null,
      likesCount: null,
      ownerReply: null,
    };

    const normalizedHeaders: { col: number; normalized: string }[] = [];
    for (const [colStr, header] of Object.entries(headers)) {
      normalizedHeaders.push({
        col: parseInt(colStr, 10),
        normalized: header.toLowerCase().trim().replace(/[\s-]/g, '_'),
      });
    }

    const usedCols = new Set<number>();

    const findMatch = (canonicalNames: string[]): number | null => {
      for (const name of canonicalNames) {
        const match = normalizedHeaders.find(
          (h) => h.normalized === name && !usedCols.has(h.col),
        );
        if (match) {
          usedCols.add(match.col);
          return match.col;
        }
      }
      return null;
    };

    map.reviewText = findMatch([
      'teks_ulasan',
      'review_text',
      'reviewtext',
      'text',
      'content',
      'komentar',
      'review',
    ]);
    map.reviewDate = findMatch([
      'tanggal_ulasan',
      'review_date',
      'reviewdate',
      'published_at',
      'publishedatdate',
      'date',
      'tanggal',
      'time',
      'waktu',
      'ulasan_date',
    ]);
    map.reviewerName = findMatch([
      'nama_pengulas',
      'reviewer_name',
      'reviewername',
      'name',
      'author',
      'user',
      'nama',
      'penulis',
    ]);
    map.rating = findMatch([
      'rating',
      'stars',
      'star',
      'score',
      'bintang',
      'nilai',
    ]);
    map.likesCount = findMatch([
      'jumlah_suka',
      'likes_count',
      'likescount',
      'likes',
      'like',
      'helpful',
      'suka',
      'berguna',
    ]);
    map.ownerReply = findMatch([
      'balasan_pemilik',
      'owner_reply',
      'responsefromownertext',
      'response',
      'balasan',
    ]);

    this.logger.log(`NLP Excel Parser Column Mapping: ${JSON.stringify(map)}`);

    return map;
  }

  private static getCellString(row: ExcelJS.Row, col: number | null): string {
    if (col === null) return '';
    const cell = row.getCell(col);
    const val = cell.value;
    if (val === null || val === undefined) return '';
    return this.stringifyCellValue(val).trim();
  }

  private static stringifyCellValue(value: ExcelJS.CellValue): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object' && 'richText' in value) {
      return value.richText.map((part) => part.text).join('');
    }
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  private static getCellNumber(
    row: ExcelJS.Row,
    col: number | null,
  ): number | null {
    if (col === null) return null;
    const cell = row.getCell(col);
    const val = cell.value;
    if (val === null || val === undefined) return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  }

  private static parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  }

  public static parseIndonesianDate(dateStr: string | null): Date | null {
    if (!dateStr || dateStr === '-') return null;

    const indonesianMonths: Record<string, string> = {
      jan: 'Jan',
      januari: 'Jan',
      feb: 'Feb',
      februari: 'Feb',
      mar: 'Mar',
      maret: 'Mar',
      apr: 'Apr',
      april: 'Apr',
      mei: 'May',
      may: 'May',
      jun: 'Jun',
      juni: 'Jun',
      jul: 'Jul',
      juli: 'Jul',
      agu: 'Aug',
      agustus: 'Aug',
      aug: 'Aug',
      sep: 'Sep',
      september: 'Sep',
      okt: 'Oct',
      oktober: 'Oct',
      oct: 'Oct',
      nov: 'Nov',
      november: 'Nov',
      des: 'Dec',
      desember: 'Dec',
      dec: 'Dec',
    };

    let englishDateStr = dateStr.toLowerCase();
    for (const [id, en] of Object.entries(indonesianMonths)) {
      if (englishDateStr.includes(id)) {
        englishDateStr = englishDateStr.replace(
          new RegExp(`\\b${id}\\b`, 'g'),
          en,
        );
        break;
      }
    }

    const d = new Date(englishDateStr);
    return isNaN(d.getTime()) ? null : d;
  }
}
