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

type HeaderEntry = {
  col: number;
  normalized: string;
};

type CsvRowReader = {
  text: (col: number | null) => string;
  number: (col: number | null) => number | null;
};

type CellStringifier = {
  matches: (value: ExcelJS.CellValue | string) => boolean;
  stringify: (value: ExcelJS.CellValue | string) => string;
};

const RAW_COLUMN_ALIASES: Record<keyof ColumnMap, string[]> = {
  reviewText: [
    'teks_ulasan',
    'teks ulasan',
    'review_text',
    'review text',
    'reviewtext',
    'text',
    'content',
    'komentar',
    'review',
  ],
  reviewDate: [
    'tanggal_ulasan',
    'tanggal ulasan',
    'review_date',
    'review date',
    'reviewdate',
    'published_at',
    'published at',
    'publishedatdate',
    'date',
    'tanggal',
    'time',
    'waktu',
    'ulasan_date',
  ],
  reviewerName: [
    'nama_pengulas',
    'nama pengulas',
    'reviewer_name',
    'reviewer name',
    'reviewername',
    'name',
    'author',
    'user',
    'nama',
    'penulis',
  ],
  rating: ['rating', 'stars', 'star', 'score', 'bintang', 'nilai'],
  likesCount: [
    'jumlah_suka',
    'jumlah suka',
    'likes_count',
    'likes count',
    'likescount',
    'likes',
    'like',
    'helpful',
    'suka',
    'berguna',
  ],
  ownerReply: [
    'balasan_pemilik',
    'balasan pemilik',
    'owner_reply',
    'owner reply',
    'responsefromownertext',
    'response',
    'balasan',
  ],
};

const COLUMN_ALIASES: Record<keyof ColumnMap, string[]> = Object.fromEntries(
  Object.entries(RAW_COLUMN_ALIASES).map(([key, aliases]) => [
    key,
    aliases.map((alias) => normalizeHeaderText(alias)),
  ]),
) as Record<keyof ColumnMap, string[]>;

const INDONESIAN_MONTHS: Record<string, string> = {
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

const CELL_STRINGIFIERS: CellStringifier[] = [
  {
    matches: (value) => value === null || value === undefined,
    stringify: () => '',
  },
  {
    matches: (value) => typeof value === 'string',
    stringify: (value) => value as string,
  },
  {
    matches: isRichTextCellValue,
    stringify: (value) =>
      (value as ExcelJS.CellRichTextValue).richText
        .map((part) => part.text)
        .join(''),
  },
  {
    matches: (value) => value instanceof Date,
    stringify: (value) => (value as Date).toISOString(),
  },
  {
    matches: (value) => typeof value === 'number' || typeof value === 'boolean',
    stringify: stringifyScalarCellValue,
  },
  {
    matches: (value) => typeof value === 'object',
    stringify: (value) => JSON.stringify(value),
  },
];

function isRichTextCellValue(
  value: ExcelJS.CellValue | string,
): value is ExcelJS.CellRichTextValue {
  return typeof value === 'object' && value !== null && 'richText' in value;
}

function stringifyScalarCellValue(value: ExcelJS.CellValue | string) {
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return '';
}

function normalizeHeaderText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

export class ExcelParserUtil {
  private static readonly logger = new Logger(ExcelParserUtil.name);

  // Membaca file Excel atau CSV hasil scraping.
  public static async parseUploadedFile(
    file: Express.Multer.File,
  ): Promise<ParsedReview[]> {
    const ext = this.getFileExtension(file.originalname);

    if (ext === '.xlsx' || ext === '.xls') return this.parseExcel(file.buffer);
    if (ext === '.csv') return this.parseCsv(file.buffer);

    throw new BadRequestException('Format file tidak didukung');
  }

  private static getFileExtension(fileName: string) {
    return fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  }

  private static async parseExcel(buffer: Buffer): Promise<ParsedReview[]> {
    const sheet = await this.loadFirstWorksheet(buffer);
    const colMap = this.buildColumnMap(this.readExcelHeaders(sheet));
    this.assertReviewTextColumnExists(colMap);
    const reviews: ParsedReview[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const review = this.parseExcelReviewRow(row, colMap);
      if (!review) return;

      if (reviews.length === 0) {
        this.logExcelSampleRow(rowNumber, review, colMap);
      }
      reviews.push(review);
    });

    return reviews;
  }

  private static async loadFirstWorksheet(buffer: Buffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

    const sheet = workbook.getWorksheet(1);
    if (!sheet) {
      throw new BadRequestException('File Excel tidak memiliki worksheet');
    }
    return sheet;
  }

  private static readExcelHeaders(sheet: ExcelJS.Worksheet) {
    const headers: Record<number, string> = {};

    sheet.getRow(1).eachCell((cell, colNumber) => {
      headers[colNumber] = this.normalizeHeader(cell.value);
    });

    this.logger.log(`Raw Excel headers: ${JSON.stringify(headers)}`);
    return headers;
  }

  private static parseExcelReviewRow(
    row: ExcelJS.Row,
    colMap: ColumnMap,
  ): ParsedReview | null {
    const reviewText = this.getCellString(row, colMap.reviewText);
    if (!reviewText) return null;

    return {
      reviewerName: this.getCellString(row, colMap.reviewerName) || 'Anonymous',
      reviewText,
      rating: this.getCellNumber(row, colMap.rating),
      reviewDate: this.getCellString(row, colMap.reviewDate),
      likesCount: this.getCellNumber(row, colMap.likesCount) || 0,
      ownerReply: this.getCellString(row, colMap.ownerReply),
    };
  }

  private static logExcelSampleRow(
    rowNumber: number,
    review: ParsedReview,
    colMap: ColumnMap,
  ) {
    this.logger.log(`Row ${rowNumber} sample data:`);
    this.logger.log(
      `   reviewText (col ${colMap.reviewText}): "${review.reviewText.substring(0, 80)}"`,
    );
    this.logger.log(
      `   reviewDate (col ${colMap.reviewDate}): "${review.reviewDate}"`,
    );
    this.logger.log(
      `   reviewerName (col ${colMap.reviewerName}): "${review.reviewerName}"`,
    );
    this.logger.log(`   rating (col ${colMap.rating}): ${review.rating}`);
  }

  private static parseCsv(buffer: Buffer): ParsedReview[] {
    const lines = this.getCsvLines(buffer);
    const delimiter = this.detectCsvDelimiter(lines[0]);
    const colMap = this.buildColumnMap(
      this.readCsvHeaders(lines[0], delimiter),
    );
    this.assertReviewTextColumnExists(colMap);

    return lines
      .slice(1)
      .map((line) => this.parseCsvReviewLine(line, colMap, delimiter))
      .filter((review): review is ParsedReview => review !== null);
  }

  private static getCsvLines(buffer: Buffer) {
    const lines = buffer
      .toString('utf-8')
      .split('\n')
      .filter((line) => line.trim().length > 0);

    if (lines.length < 2) {
      throw new BadRequestException('File CSV kosong atau tidak valid');
    }
    return lines;
  }

  private static detectCsvDelimiter(headerLine: string) {
    const commaCount = (headerLine.match(/,/g) ?? []).length;
    const semicolonCount = (headerLine.match(/;/g) ?? []).length;
    return semicolonCount > commaCount ? ';' : ',';
  }

  private static readCsvHeaders(headerLine: string, delimiter: ',' | ';') {
    const headers: Record<number, string> = {};

    this.parseCsvLine(headerLine, delimiter).forEach((header, index) => {
      headers[index + 1] = this.normalizeHeader(header);
    });

    return headers;
  }

  private static parseCsvReviewLine(
    line: string,
    colMap: ColumnMap,
    delimiter: ',' | ';',
  ): ParsedReview | null {
    const reader = this.createCsvRowReader(this.parseCsvLine(line, delimiter));
    const reviewText = reader.text(colMap.reviewText);
    if (!reviewText) return null;

    return {
      reviewerName: reader.text(colMap.reviewerName) || 'Anonymous',
      reviewText,
      rating: reader.number(colMap.rating),
      reviewDate: reader.text(colMap.reviewDate),
      likesCount: reader.number(colMap.likesCount) || 0,
      ownerReply: reader.text(colMap.ownerReply),
    };
  }

  private static createCsvRowReader(parts: string[]): CsvRowReader {
    const text = (col: number | null) =>
      col !== null && parts[col - 1] ? parts[col - 1].trim() : '';

    return {
      text,
      number: (col: number | null) => this.parseNullableNumber(text(col)),
    };
  }

  private static buildColumnMap(headers: Record<number, string>): ColumnMap {
    const normalizedHeaders = this.toHeaderEntries(headers);
    const usedCols = new Set<number>();
    const map = this.createEmptyColumnMap();

    for (const key of Object.keys(COLUMN_ALIASES) as (keyof ColumnMap)[]) {
      map[key] = this.findColumnMatch(
        normalizedHeaders,
        usedCols,
        COLUMN_ALIASES[key],
      );
    }

    this.logger.log(`NLP Excel Parser Column Mapping: ${JSON.stringify(map)}`);
    return map;
  }

  private static createEmptyColumnMap(): ColumnMap {
    return {
      reviewerName: null,
      reviewText: null,
      rating: null,
      reviewDate: null,
      likesCount: null,
      ownerReply: null,
    };
  }

  private static assertReviewTextColumnExists(colMap: ColumnMap) {
    if (colMap.reviewText !== null) return;

    throw new BadRequestException(
      'Kolom teks ulasan tidak ditemukan. Gunakan header seperti "Teks Ulasan", "review_text", "review text", "text", "komentar", atau "review".',
    );
  }

  private static toHeaderEntries(headers: Record<number, string>) {
    return Object.entries(headers).map(([colStr, header]) => ({
      col: parseInt(colStr, 10),
      normalized: this.normalizeHeader(header),
    }));
  }

  private static normalizeHeader(value: ExcelJS.CellValue | string) {
    return normalizeHeaderText(this.stringifyCellValue(value));
  }

  private static findColumnMatch(
    headers: HeaderEntry[],
    usedCols: Set<number>,
    canonicalNames: string[],
  ): number | null {
    const match = canonicalNames
      .map((name) =>
        headers.find(
          (header) => header.normalized === name && !usedCols.has(header.col),
        ),
      )
      .find(Boolean);

    if (!match) return null;

    usedCols.add(match.col);
    return match.col;
  }

  private static getCellString(row: ExcelJS.Row, col: number | null): string {
    if (col === null) return '';
    return this.stringifyCellValue(row.getCell(col).value).trim();
  }

  private static stringifyCellValue(value: ExcelJS.CellValue | string): string {
    const stringifier = CELL_STRINGIFIERS.find((item) => item.matches(value));
    return stringifier ? stringifier.stringify(value) : '';
  }

  private static getCellNumber(
    row: ExcelJS.Row,
    col: number | null,
  ): number | null {
    if (col === null) return null;
    return this.parseNullableNumber(row.getCell(col).value);
  }

  private static parseNullableNumber(value: ExcelJS.CellValue | string) {
    if (value === null || value === undefined) return null;
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
  }

  private static parseCsvLine(line: string, delimiter: ',' | ';'): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let index = 0; index < line.length; index++) {
      const state = this.readCsvCharacter(
        line,
        index,
        current,
        inQuotes,
        delimiter,
      );
      current = state.current;
      inQuotes = state.inQuotes;
      index = state.index;

      if (state.shouldFlush) {
        result.push(current);
        current = '';
      }
    }

    result.push(current);
    return result;
  }

  private static readCsvCharacter(
    line: string,
    index: number,
    current: string,
    inQuotes: boolean,
    delimiter: ',' | ';',
  ) {
    const ch = line[index];

    if (ch === '"') {
      return this.readCsvQuote(line, index, current, inQuotes);
    }

    if (ch === delimiter && !inQuotes) {
      return { current, inQuotes, index, shouldFlush: true };
    }

    return {
      current: current + ch,
      inQuotes,
      index,
      shouldFlush: false,
    };
  }

  private static readCsvQuote(
    line: string,
    index: number,
    current: string,
    inQuotes: boolean,
  ) {
    if (inQuotes && line[index + 1] === '"') {
      return {
        current: current + '"',
        inQuotes,
        index: index + 1,
        shouldFlush: false,
      };
    }

    return {
      current,
      inQuotes: !inQuotes,
      index,
      shouldFlush: false,
    };
  }

  public static parseIndonesianDate(dateStr: string | null): Date | null {
    if (!dateStr || dateStr === '-') return null;

    const englishDateStr = this.translateIndonesianMonth(dateStr);
    const date = new Date(englishDateStr);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private static translateIndonesianMonth(dateStr: string) {
    let englishDateStr = dateStr.toLowerCase();
    const matchedMonth = Object.entries(INDONESIAN_MONTHS).find(([id]) =>
      englishDateStr.includes(id),
    );

    if (!matchedMonth) return englishDateStr;

    const [indonesianMonth, englishMonth] = matchedMonth;
    englishDateStr = englishDateStr.replace(indonesianMonth, englishMonth);
    return englishDateStr;
  }
}
