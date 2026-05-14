import {
  Controller,
  Post,
  HttpCode,
  UploadedFile,
  UseInterceptors,
  Body,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { PrismaService } from '../../prisma/prisma.service';
import { NlpService } from './nlp.service';
import { NlpResultStorageService } from './nlp-result-storage.service';
import { CsvService } from '../scraper/csv.service';
import { Roles } from '../../common/decorators/roles.decorator';
import * as ExcelJS from 'exceljs';

@ApiTags('Admin - NLP Processing')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/nlp')
export class NlpController {
  private readonly logger = new Logger(NlpController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly nlpService: NlpService,
    private readonly nlpStorageService: NlpResultStorageService,
    private readonly csvService: CsvService,
  ) {}

  /**
   * Upload file Excel/CSV hasil scraping dan langsung proses NLP.
   *
   * Flow:
   * 1. Parse file Excel/CSV
   * 2. Insert ulasan ke tabel Review
   * 3. Hitung rata-rata rating scraping → simpan ke destination.userRating
   * 4. Kirim data ke FastAPI untuk NLP processing
   * 5. Simpan hasil NLP ke database
   */
  @Post('upload')
  @HttpCode(202)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
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

        if (
          allowedMimes.includes(file.mimetype) ||
          allowedExts.includes(ext)
        ) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Hanya file Excel (.xlsx) atau CSV (.csv) yang diperbolehkan',
            ),
            false,
          );
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload file Excel/CSV dan proses NLP',
    description:
      'Upload file hasil scraping. Sistem akan: ' +
      '(1) Membaca & parse file, ' +
      '(2) Menyimpan ulasan ke database, ' +
      '(3) Menghitung rata-rata rating scraping, ' +
      '(4) Menjalankan pipeline NLP (sentiment, topic, embedding).',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        destination_id: { type: 'integer' },
      },
    },
  })
  @ApiResponse({ status: 202, description: 'NLP processing berhasil dimulai' })
  @ApiResponse({ status: 400, description: 'File tidak valid atau destinasi tidak ditemukan' })
  async uploadAndProcess(
    @UploadedFile() file: Express.Multer.File,
    @Body('destination_id') destinationIdStr: string,
  ) {
    if (!file) {
      throw new BadRequestException('File harus disertakan');
    }

    const destinationId = parseInt(destinationIdStr, 10);
    if (isNaN(destinationId)) {
      throw new BadRequestException('destination_id harus berupa angka');
    }

    const destination = await this.prisma.destination.findUnique({
      where: { id: destinationId },
    });

    if (!destination) {
      throw new NotFoundException('Destinasi tidak ditemukan');
    }

    this.logger.log(
      `Processing NLP upload for destination "${destination.name}" (${file.originalname})`,
    );

    // 1. Parse file
    const reviews = await this.parseUploadedFile(file);

    if (reviews.length === 0) {
      throw new BadRequestException(
        'File tidak mengandung data ulasan yang valid',
      );
    }

    this.logger.log(`Parsed ${reviews.length} reviews from uploaded file`);

    // 2. Insert reviews ke database
    const reviewIds: number[] = [];
    for (const review of reviews) {
      const created = await this.prisma.review.create({
        data: {
          destinationId,
          reviewerName: review.reviewerName || 'Anonymous',
          reviewText: review.reviewText || null,
          rating: review.rating || null,
          reviewDate: this.parseIndonesianDate(review.reviewDate),
          source: 'google_maps',
          likesCount: review.likesCount || 0,
          ownerReply: review.ownerReply || null,
        },
      });
      reviewIds.push(created.id);
    }

    this.logger.log(`Inserted ${reviewIds.length} reviews to database`);

    // 3. Hitung rata-rata rating scraping dan update destination
    const ratingAgg = await this.prisma.review.aggregate({
      where: { destinationId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.destination.update({
      where: { id: destinationId },
      data: {
        userRating: ratingAgg._avg.rating
          ? parseFloat(ratingAgg._avg.rating.toFixed(2))
          : null,
        userReviewCount: ratingAgg._count.rating,
      },
    });

    this.logger.log(
      `Updated scraped rating: ${ratingAgg._avg.rating?.toFixed(2)} (${ratingAgg._count.rating} reviews)`,
    );

    // 4. Proses NLP — format CSV untuk FastAPI
    const nlpData = reviews.map((r, index) => ({
      review_id: reviewIds[index],
      'Teks Ulasan': r.reviewText || '',
      'Nama Pengulas': r.reviewerName || '',
      'Rating': r.rating || 0,
      'Tanggal Ulasan': r.reviewDate || '',
      'Jumlah Suka': r.likesCount || 0,
    }));

    const csvString = this.csvService.generateInternalCsv(nlpData);
    const csvBuffer = Buffer.from(csvString);

    let nlpResult;
    try {
      nlpResult = await this.nlpService.processPipeline(
        csvBuffer,
        `reviews_upload_${destinationId}.csv`,
      );
      this.logger.log(
        `FastAPI returned ${nlpResult.results?.length || 0} results`,
      );
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.warn(`FastAPI failed: ${errorMessage}`);

      // Fallback hanya di development
      if (process.env.NODE_ENV === 'production') {
        throw new BadRequestException(
          `NLP processing gagal: ${errorMessage}`,
        );
      }

      this.logger.warn('Using dummy data fallback (development only).');
      const positiveCount = reviews.filter(
        (r) => r.rating && r.rating >= 4,
      ).length;
      const negativeCount = reviews.filter(
        (r) => r.rating && r.rating <= 2,
      ).length;
      const neutralCount = reviews.length - positiveCount - negativeCount;

      nlpResult = {
        summary: {
          total: reviews.length,
          positive: positiveCount,
          negative: negativeCount,
          neutral: neutralCount,
        },
        results: reviews.map((r, i) => ({
          review_id: reviewIds[i],
          text: r.reviewText || '',
          cleaned_text: r.reviewText?.toLowerCase() || '',
          sentiment:
            r.rating && r.rating >= 4
              ? 'positif'
              : r.rating && r.rating <= 2
                ? 'negatif'
                : 'netral',
          topic_id: null,
          embedding: Array(384)
            .fill(0)
            .map((_, idx) => Math.sin(i * 0.1 + idx * 0.01) * 0.1),
        })),
        topics: [],
      };
    }

    // 5. Simpan hasil NLP
    await this.nlpStorageService.saveNlpResults(
      destinationId,
      nlpResult,
      reviewIds,
    );

    this.logger.log(
      `NLP processing completed for destination "${destination.name}"`,
    );

    return {
      message: 'File berhasil diupload dan NLP processing selesai',
      destination_name: destination.name,
      total_reviews_processed: reviewIds.length,
      scraped_average_rating: ratingAgg._avg.rating
        ? parseFloat(ratingAgg._avg.rating.toFixed(2))
        : null,
      nlp_summary: nlpResult.summary,
    };
  }

  /**
   * Parse file Excel (.xlsx) atau CSV yang diupload.
   * Mendukung format output dari ScraperProcessor.
   */
  private async parseUploadedFile(
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

  private async parseExcel(buffer: Buffer): Promise<ParsedReview[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const sheet = workbook.getWorksheet(1);
    if (!sheet) {
      throw new BadRequestException('File Excel tidak memiliki worksheet');
    }

    const reviews: ParsedReview[] = [];
    const headerRow = sheet.getRow(1);
    const headers: Record<number, string> = {};

    headerRow.eachCell((cell, colNumber) => {
      const val = String(cell.value || '').trim().toLowerCase();
      headers[colNumber] = val;
    });

    this.logger.log(`📋 Raw Excel headers: ${JSON.stringify(headers)}`);

    // Mapping kolom — mendukung format RanahInsight dan format umum
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

      // Debug: log first data row
      if (isFirstDataRow) {
        this.logger.log(`📋 Row ${rowNumber} sample data:`);
        this.logger.log(`   reviewText (col ${colMap.reviewText}): "${(reviewText || '').substring(0, 80)}"`);
        this.logger.log(`   reviewDate (col ${colMap.reviewDate}): "${reviewDate}"`);
        this.logger.log(`   reviewerName (col ${colMap.reviewerName}): "${reviewerName}"`);
        this.logger.log(`   rating (col ${colMap.rating}): ${rating}`);
        // Also log raw cell values for all columns in this row
        this.logger.log(`   Raw cells: ${JSON.stringify(
          Array.from({ length: 7 }, (_, i) => {
            const cell = row.getCell(i + 1);
            return { col: i + 1, value: String(cell.value || '').substring(0, 50), type: typeof cell.value };
          })
        )}`);
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

  private parseCsv(buffer: Buffer): ParsedReview[] {
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

  /**
   * Mapping kolom berdasarkan canonical name matching (exact match, prioritized).
   * Urutan canonical names dari paling spesifik ke paling generik.
   * Setiap kolom hanya bisa di-claim oleh satu field (usedCols tracking).
   */
  private buildColumnMap(headers: Record<number, string>): ColumnMap {
    const map: ColumnMap = {
      reviewerName: null,
      reviewText: null,
      rating: null,
      reviewDate: null,
      likesCount: null,
      ownerReply: null,
    };

    // Normalize header: lowercase, trim, replace spaces/hyphens with underscore
    const normalizedHeaders: { col: number; normalized: string }[] = [];
    for (const [colStr, header] of Object.entries(headers)) {
      normalizedHeaders.push({
        col: parseInt(colStr, 10),
        normalized: header.toLowerCase().trim().replace(/[\s\-]/g, '_'),
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

    // Order matters: more specific fields first to prevent cross-contamination
    // e.g. "teks_ulasan" must be matched before generic "ulasan"
    map.reviewText = findMatch([
      'teks_ulasan', 'review_text', 'reviewtext', 'text', 'content', 'komentar', 'review',
    ]);
    map.reviewDate = findMatch([
      'tanggal_ulasan', 'review_date', 'reviewdate', 'published_at', 'publishedatdate', 'date', 'tanggal', 'time', 'waktu', 'ulasan_date',
    ]);
    map.reviewerName = findMatch([
      'nama_pengulas', 'reviewer_name', 'reviewername', 'name', 'author', 'user', 'nama', 'penulis',
    ]);
    map.rating = findMatch([
      'rating', 'stars', 'star', 'score', 'bintang', 'nilai',
    ]);
    map.likesCount = findMatch([
      'jumlah_suka', 'likes_count', 'likescount', 'likes', 'like', 'helpful', 'suka', 'berguna',
    ]);
    map.ownerReply = findMatch([
      'balasan_pemilik', 'owner_reply', 'responsefromownertext', 'response', 'balasan',
    ]);

    this.logger.log(`NLP Controller Column Mapping: ${JSON.stringify(map)}`);

    return map;
  }

  private getCellString(row: ExcelJS.Row, col: number | null): string {
    if (col === null) return '';
    const cell = row.getCell(col);
    const val = cell.value;
    if (val === null || val === undefined) return '';
    if (typeof val === 'object' && 'richText' in val) {
      return (val as any).richText.map((r: any) => r.text).join('');
    }
    return String(val).trim();
  }

  private getCellNumber(row: ExcelJS.Row, col: number | null): number | null {
    if (col === null) return null;
    const cell = row.getCell(col);
    const val = cell.value;
    if (val === null || val === undefined) return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  }

  private parseCsvLine(line: string): string[] {
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

  private parseIndonesianDate(dateStr: string | null): Date | null {
    if (!dateStr || dateStr === '-') return null;
    
    const indonesianMonths: Record<string, string> = {
      jan: 'Jan', januari: 'Jan',
      feb: 'Feb', februari: 'Feb',
      mar: 'Mar', maret: 'Mar',
      apr: 'Apr', april: 'Apr',
      mei: 'May', may: 'May',
      jun: 'Jun', juni: 'Jun',
      jul: 'Jul', juli: 'Jul',
      agu: 'Aug', agustus: 'Aug', aug: 'Aug',
      sep: 'Sep', september: 'Sep',
      okt: 'Oct', oktober: 'Oct', oct: 'Oct',
      nov: 'Nov', november: 'Nov',
      des: 'Dec', desember: 'Dec', dec: 'Dec'
    };

    let englishDateStr = dateStr.toLowerCase();
    for (const [id, en] of Object.entries(indonesianMonths)) {
      if (englishDateStr.includes(id)) {
        englishDateStr = englishDateStr.replace(new RegExp(`\\b${id}\\b`, 'g'), en);
        break;
      }
    }

    const d = new Date(englishDateStr);
    return isNaN(d.getTime()) ? null : d;
  }
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface ParsedReview {
  reviewerName: string;
  reviewText: string;
  rating: number | null;
  reviewDate: string;
  likesCount: number;
  ownerReply: string | null;
}

interface ColumnMap {
  reviewerName: number | null;
  reviewText: number | null;
  rating: number | null;
  reviewDate: number | null;
  likesCount: number | null;
  ownerReply: number | null;
}
