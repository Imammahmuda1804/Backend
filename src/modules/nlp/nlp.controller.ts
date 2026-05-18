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
import { ExcelParserUtil } from './utils/excel-parser.util';

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
   * 3. Hitung rata-rata rating scraping dan simpan ke rating Google destination
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

        if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
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
  @ApiResponse({
    status: 400,
    description: 'File tidak valid atau destinasi tidak ditemukan',
  })
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
    const reviews = await ExcelParserUtil.parseUploadedFile(file);

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
          reviewDate: ExcelParserUtil.parseIndonesianDate(review.reviewDate),
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
        googleRating: ratingAgg._avg.rating
          ? parseFloat(ratingAgg._avg.rating.toFixed(2))
          : null,
        googleReviewCount: ratingAgg._count.rating,
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
      Rating: r.rating || 0,
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
        await this.cleanupInsertedReviews(destinationId, reviewIds);
        throw new BadRequestException(`NLP processing gagal: ${errorMessage}`);
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

  private async cleanupInsertedReviews(
    destinationId: number,
    reviewIds: number[],
  ) {
    if (reviewIds.length === 0) return;

    try {
      await this.prisma.review.deleteMany({
        where: { id: { in: reviewIds } },
      });

      const ratingAgg = await this.prisma.review.aggregate({
        where: { destinationId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await this.prisma.destination.update({
        where: { id: destinationId },
        data: {
          googleRating: ratingAgg._avg.rating
            ? parseFloat(ratingAgg._avg.rating.toFixed(2))
            : null,
          googleReviewCount: ratingAgg._count.rating,
        },
      });

      this.logger.warn(
        `Rolled back ${reviewIds.length} inserted reviews after NLP failure`,
      );
    } catch (cleanupError: unknown) {
      const cleanupMessage =
        cleanupError instanceof Error
          ? cleanupError.message
          : String(cleanupError);
      this.logger.error(
        `Failed to rollback NLP upload reviews: ${cleanupMessage}`,
      );
    }
  }
}
