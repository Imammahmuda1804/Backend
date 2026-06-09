import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NlpReviewDedupService } from './nlp-review-dedup.service';
import type { PreparedNlpFile } from './nlp-upload.types';
import { attachReviewHashes, createFileHash } from './utils/nlp-dedup.util';
import { ExcelParserUtil } from './utils/excel-parser.util';

@Injectable()
export class NlpUploadPreparationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dedupService: NlpReviewDedupService,
  ) {}

  async preflight(file: Express.Multer.File, destinationIdText: string) {
    const prepared = await this.prepareFile(file, destinationIdText);
    const existingHashes = await this.dedupService.getExistingReviewHashes(
      prepared.destinationId,
      prepared.hashedReviews,
    );
    const previousRun = await this.findPreviousRun(prepared);
    const duplicateRows = this.dedupService.countDuplicateRows(
      prepared.hashedReviews,
      existingHashes,
    );

    return {
      destination_id: prepared.destinationId,
      destination_name: prepared.destinationName,
      file_name: prepared.fileName,
      file_hash: prepared.fileHash,
      total_rows: prepared.hashedReviews.length,
      new_reviews: prepared.hashedReviews.length - duplicateRows,
      duplicate_reviews: duplicateRows,
      already_processed: Boolean(previousRun),
      previous_run: previousRun,
      recommended_mode:
        previousRun && duplicateRows === prepared.hashedReviews.length
          ? 'reprocess_existing'
          : 'skip_existing',
    };
  }

  async prepareFile(
    file: Express.Multer.File,
    destinationIdText: string,
  ): Promise<PreparedNlpFile> {
    const destinationId = this.parseDestinationId(destinationIdText);
    const destination = await this.findDestination(destinationId);
    const reviews = await this.parseReviews(file);

    return {
      destinationId,
      destinationName: destination.name,
      fileName: file.originalname,
      fileHash: createFileHash(file.buffer),
      hashedReviews: attachReviewHashes(destinationId, reviews),
    };
  }

  private findPreviousRun(prepared: PreparedNlpFile) {
    return this.prisma.nlpProcessingRun.findFirst({
      where: {
        destinationId: prepared.destinationId,
        fileHash: prepared.fileHash,
      },
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
  }

  private parseDestinationId(value: string) {
    const destinationId = parseInt(value, 10);
    if (Number.isNaN(destinationId)) {
      throw new BadRequestException('destination_id harus berupa angka');
    }
    return destinationId;
  }

  private async findDestination(destinationId: number) {
    const destination = await this.prisma.destination.findUnique({
      where: { id: destinationId },
      select: { id: true, name: true },
    });
    if (!destination) throw new NotFoundException('Destinasi tidak ditemukan');
    return destination;
  }

  private async parseReviews(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File harus disertakan');
    const reviews = await ExcelParserUtil.parseUploadedFile(file);
    if (reviews.length === 0) {
      throw new BadRequestException('File tidak mengandung data ulasan valid');
    }
    return reviews;
  }
}
