import {
  Controller,
  Post,
  Get,
  HttpCode,
  UploadedFile,
  UseInterceptors,
  Body,
  BadRequestException,
  NotFoundException,
  Logger,
  Query,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { PrismaService } from '../../prisma/prisma.service';
import { NlpService } from './nlp.service';
import { NlpResultStorageService } from './nlp-result-storage.service';
import { CsvService } from '../scraper/csv.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ExcelParserUtil, ParsedReview } from './utils/excel-parser.util';
import {
  attachReviewHashes,
  createFileHash,
  normalizeNlpMode,
} from './utils/nlp-dedup.util';

const NLP_UPLOAD_FILE_OPTIONS = {
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (
    _req: unknown,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
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
};

type ReviewWithHash = ParsedReview & { reviewHash: string };
type ProcessReview = ReviewWithHash & { id: number };

@ApiTags('Admin - NLP Processing')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/nlp')
// Membuka endpoint admin untuk upload file ulasan dan proses NLP.
export class NlpController {
  private readonly logger = new Logger(NlpController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly nlpService: NlpService,
    private readonly nlpStorageService: NlpResultStorageService,
    private readonly csvService: CsvService,
  ) {}

  @Post('preflight')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file', NLP_UPLOAD_FILE_OPTIONS))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Cek file NLP sebelum diproses',
    description:
      'Membaca file review, menghitung hash file/review, dan mengembalikan jumlah review baru serta duplikat.',
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
  async preflight(
    @UploadedFile() file: Express.Multer.File,
    @Body('destination_id') destinationIdStr: string,
  ) {
    const destinationId = this.parseDestinationId(destinationIdStr);
    const destination = await this.getDestinationOrThrow(destinationId);
    const reviews = await this.parseFileOrThrow(file);
    const hashedReviews = attachReviewHashes(destinationId, reviews);
    const fileHash = createFileHash(file.buffer);
    const existingHashes = await this.getExistingReviewHashes(
      destinationId,
      hashedReviews,
    );
    const previousRun = await this.prisma.nlpProcessingRun.findFirst({
      where: { destinationId, fileHash },
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        status: true,
        mode: true,
        startedAt: true,
        insertedReviews: true,
        skippedDuplicates: true,
        processedReviews: true,
      },
    });

    const duplicateRows = hashedReviews.filter((review) =>
      existingHashes.has(review.reviewHash),
    ).length;

    return {
      destination_id: destinationId,
      destination_name: destination.name,
      file_name: file.originalname,
      file_hash: fileHash,
      total_rows: hashedReviews.length,
      new_reviews: hashedReviews.length - duplicateRows,
      duplicate_reviews: duplicateRows,
      already_processed: Boolean(previousRun),
      previous_run: previousRun,
      recommended_mode:
        previousRun && duplicateRows === hashedReviews.length
          ? 'reprocess_existing'
          : 'skip_existing',
    };
  }

  @Get('history')
  @ApiOperation({ summary: 'List riwayat proses NLP admin' })
  @ApiQuery({ name: 'destination_id', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getHistory(
    @Query('destination_id') destinationId?: string,
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const take = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
    const skip = (currentPage - 1) * take;
    const where = {
      ...(destinationId ? { destinationId: parseInt(destinationId, 10) } : {}),
      ...(status ? { status } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.nlpProcessingRun.findMany({
        where,
        skip,
        take,
        orderBy: { startedAt: 'desc' },
        include: {
          destination: { select: { id: true, name: true, city: true } },
          admin: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.nlpProcessingRun.count({ where }),
    ]);

    return {
      data,
      meta: {
        page: currentPage,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  @Get('history/:id')
  @ApiOperation({ summary: 'Detail riwayat proses NLP admin' })
  async getHistoryDetail(@Param('id') id: string) {
    const runId = parseInt(id, 10);
    if (isNaN(runId)) throw new BadRequestException('id harus berupa angka');

    const run = await this.prisma.nlpProcessingRun.findUnique({
      where: { id: runId },
      include: {
        destination: { select: { id: true, name: true, city: true } },
        admin: { select: { id: true, name: true, email: true } },
      },
    });

    if (!run) throw new NotFoundException('Riwayat proses NLP tidak ditemukan');
    return run;
  }

  @Post('upload')
  @HttpCode(202)
  @UseInterceptors(FileInterceptor('file', NLP_UPLOAD_FILE_OPTIONS))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload file Excel/CSV dan proses NLP',
    description:
      'Upload file hasil scraping dengan dedup review. Mode default skip_existing agar file yang sama tidak membuat review duplikat.',
  })
  @ApiBody({
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
  })
  @ApiResponse({ status: 202, description: 'NLP processing berhasil dimulai' })
  @ApiResponse({
    status: 400,
    description: 'File tidak valid atau destinasi tidak ditemukan',
  })
  async uploadAndProcess(
    @UploadedFile() file: Express.Multer.File,
    @Body('destination_id') destinationIdStr: string,
    @Body('mode') rawMode: string | undefined,
    @CurrentUser('id') adminId?: number,
  ) {
    const destinationId = this.parseDestinationId(destinationIdStr);
    const mode = normalizeNlpMode(rawMode);
    const destination = await this.getDestinationOrThrow(destinationId);
    const reviews = await this.parseFileOrThrow(file);
    const hashedReviews = attachReviewHashes(destinationId, reviews);
    const fileHash = createFileHash(file.buffer);

    const run = await this.prisma.nlpProcessingRun.create({
      data: {
        destinationId,
        adminId,
        fileName: file.originalname,
        fileHash,
        mode,
        status: 'processing',
        totalRows: hashedReviews.length,
      },
    });

    const insertedReviewIds: number[] = [];

    try {
      if (mode === 'replace_existing') {
        await this.resetDestinationNlpData(destinationId);
      }

      const existingReviews =
        mode === 'replace_existing'
          ? new Map<string, number>()
          : await this.getExistingReviewMap(destinationId, hashedReviews);

      const duplicateRows = hashedReviews.filter((review) =>
        existingReviews.has(review.reviewHash),
      ).length;

      const processReviews: ProcessReview[] = [];

      for (const review of hashedReviews) {
        const existingId = existingReviews.get(review.reviewHash);
        if (existingId) {
          if (mode === 'reprocess_existing') {
            processReviews.push({ ...review, id: existingId });
          }
          continue;
        }

        const created = await this.prisma.review.create({
          data: {
            destinationId,
            reviewerName: review.reviewerName || 'Anonymous',
            reviewText: review.reviewText || null,
            rating: review.rating || null,
            reviewDate: ExcelParserUtil.parseIndonesianDate(review.reviewDate),
            source: 'google_maps',
            reviewHash: review.reviewHash,
            likesCount: review.likesCount || 0,
            ownerReply: review.ownerReply || null,
          },
        });
        insertedReviewIds.push(created.id);
        processReviews.push({ ...review, id: created.id });
      }

      if (processReviews.length > 0) {
        const nlpResult = await this.runPipeline(destinationId, processReviews);
        await this.nlpStorageService.saveNlpResults(
          destinationId,
          nlpResult,
          processReviews.map((review) => review.id),
        );
      }

      const ratingAgg = await this.refreshDestinationRating(destinationId);

      await this.prisma.nlpProcessingRun.update({
        where: { id: run.id },
        data: {
          status: 'completed',
          insertedReviews: insertedReviewIds.length,
          skippedDuplicates:
            mode === 'replace_existing'
              ? 0
              : mode === 'skip_existing'
                ? duplicateRows
                : Math.max(0, duplicateRows - processReviews.length),
          processedReviews: processReviews.length,
          finishedAt: new Date(),
        },
      });

      this.logger.log(
        `NLP processing completed for destination "${destination.name}"`,
      );

      return {
        message: 'File berhasil diupload dan NLP processing selesai',
        run_id: run.id,
        mode,
        destination_name: destination.name,
        total_reviews_processed: processReviews.length,
        inserted_reviews: insertedReviewIds.length,
        skipped_duplicates:
          mode === 'replace_existing'
            ? 0
            : hashedReviews.length - insertedReviewIds.length,
        scraped_average_rating: ratingAgg._avg.rating
          ? parseFloat(ratingAgg._avg.rating.toFixed(2))
          : null,
        nlp_summary: await this.getSentimentSummary(destinationId),
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`NLP processing failed: ${errorMessage}`);

      if (mode !== 'replace_existing') {
        await this.cleanupInsertedReviews(destinationId, insertedReviewIds);
      }

      await this.prisma.nlpProcessingRun.update({
        where: { id: run.id },
        data: {
          status: 'failed',
          errorMessage,
          insertedReviews: insertedReviewIds.length,
          finishedAt: new Date(),
        },
      });

      throw new BadRequestException(`NLP processing gagal: ${errorMessage}`);
    }
  }

  private parseDestinationId(destinationIdStr: string) {
    const destinationId = parseInt(destinationIdStr, 10);
    if (isNaN(destinationId)) {
      throw new BadRequestException('destination_id harus berupa angka');
    }
    return destinationId;
  }

  private async getDestinationOrThrow(destinationId: number) {
    const destination = await this.prisma.destination.findUnique({
      where: { id: destinationId },
    });
    if (!destination) throw new NotFoundException('Destinasi tidak ditemukan');
    return destination;
  }

  private async parseFileOrThrow(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File harus disertakan');
    const reviews = await ExcelParserUtil.parseUploadedFile(file);
    if (reviews.length === 0) {
      throw new BadRequestException('File tidak mengandung data ulasan valid');
    }
    return reviews;
  }

  private async getExistingReviewHashes(
    destinationId: number,
    reviews: ReviewWithHash[],
  ) {
    const existing = await this.prisma.review.findMany({
      where: {
        destinationId,
        source: 'google_maps',
        reviewHash: { in: reviews.map((review) => review.reviewHash) },
      },
      select: { reviewHash: true },
    });
    return new Set(existing.map((review) => review.reviewHash).filter(Boolean));
  }

  private async getExistingReviewMap(
    destinationId: number,
    reviews: ReviewWithHash[],
  ) {
    const existing = await this.prisma.review.findMany({
      where: {
        destinationId,
        source: 'google_maps',
        reviewHash: { in: reviews.map((review) => review.reviewHash) },
      },
      select: { id: true, reviewHash: true },
    });
    return new Map(
      existing
        .filter((review) => review.reviewHash)
        .map((review) => [review.reviewHash as string, review.id]),
    );
  }

  private async runPipeline(destinationId: number, reviews: ProcessReview[]) {
    const nlpData = reviews.map((review) => ({
      review_id: review.id,
      'Teks Ulasan': review.reviewText || '',
      'Nama Pengulas': review.reviewerName || '',
      Rating: review.rating || 0,
      'Tanggal Ulasan': review.reviewDate || '',
      'Jumlah Suka': review.likesCount || 0,
    }));

    const csvString = this.csvService.generateInternalCsv(nlpData);
    const csvBuffer = Buffer.from(csvString);

    try {
      const nlpResult = await this.nlpService.processPipeline(
        csvBuffer,
        `reviews_upload_${destinationId}.csv`,
      );
      this.logger.log(
        `FastAPI returned ${nlpResult.results?.length || 0} results`,
      );
      this.assertValidPipelineResult(nlpResult, reviews.length);
      return nlpResult;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.warn(`FastAPI failed: ${errorMessage}`);
      throw err;
    }
  }

  private assertValidPipelineResult(
    nlpResult: {
      results?: Array<{ topic_id?: number | string | null }>;
      topics?: unknown[];
    },
    expectedCount: number,
  ) {
    const results = nlpResult.results ?? [];
    if (expectedCount > 0 && results.length === 0) {
      throw new BadRequestException(
        'Model NLP tidak mengembalikan hasil untuk review yang diproses.',
      );
    }

    const hasTopicList = (nlpResult.topics ?? []).length > 0;
    const hasMappedTopic = results.some(
      (result) => result.topic_id !== null && result.topic_id !== undefined,
    );
    if (expectedCount > 0 && !hasTopicList && !hasMappedTopic) {
      throw new BadRequestException(
        'Model NLP tidak mengembalikan topik. Pastikan service Model aktif dan model BERTopic berhasil dimuat.',
      );
    }
  }

  private async resetDestinationNlpData(destinationId: number) {
    await this.prisma.review.deleteMany({
      where: { destinationId, source: 'google_maps' },
    });
    await this.prisma.destinationTopic.deleteMany({ where: { destinationId } });
    await this.prisma.sentimentTrend.deleteMany({ where: { destinationId } });
  }

  private async refreshDestinationRating(destinationId: number) {
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

    return ratingAgg;
  }

  private async getSentimentSummary(destinationId: number) {
    const grouped = await this.prisma.review.groupBy({
      by: ['sentiment'],
      where: { destinationId, sentiment: { not: null } },
      _count: { _all: true },
    });

    const summary = { total: 0, positive: 0, negative: 0, neutral: 0 };
    for (const item of grouped) {
      const count = item._count._all;
      summary.total += count;
      if (item.sentiment === 'positive') summary.positive += count;
      else if (item.sentiment === 'negative') summary.negative += count;
      else summary.neutral += count;
    }
    return summary;
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
      await this.refreshDestinationRating(destinationId);
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
