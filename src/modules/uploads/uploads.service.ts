import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FileParserService, detectColumnMapping } from './file-parser.service';
import { Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

function stringifyField(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return JSON.stringify(value) ?? fallback;
  return fallback;
}

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fileParser: FileParserService,
    @InjectQueue('nlp-queue') private readonly nlpQueue: Queue,
  ) {}

  async processUpload(
    destinationId: number,
    file: Express.Multer.File,
    adminId?: number,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File melebihi batas maksimal 10MB');
    }

    const destination = await this.prisma.destination.findUnique({
      where: { id: destinationId },
    });

    if (!destination) {
      throw new NotFoundException('Destination not found');
    }

    const parsedData = this.fileParser.parseExcelOrCsv(
      file.buffer,
      file.originalname,
    );
    const validData = this.fileParser.validateRows(parsedData);

    const job = await this.prisma.scrapingJob.create({
      data: {
        destinationId,
        status: 'completed', // We set it to completed since we already have the raw reviews
        source: 'upload',
        totalReviews: validData.length,
        startedAt: new Date(),
        finishedAt: new Date(),
        createdBy: adminId,
      },
    });

    const firstRow = validData.length > 0 ? validData[0] : {};
    const mapping = detectColumnMapping(firstRow, this.logger);

    // Debug: log raw keys and mapped sample values from first row
    this.logger.log(
      `Raw column keys: ${JSON.stringify(Object.keys(firstRow))}`,
    );
    this.logger.log(
      `Sample mapped values from row[0]: reviewText=${JSON.stringify(mapping.reviewText ? firstRow[mapping.reviewText] : null)}, reviewDate=${JSON.stringify(mapping.reviewDate ? firstRow[mapping.reviewDate] : null)}, reviewerName=${JSON.stringify(mapping.reviewerName ? firstRow[mapping.reviewerName] : null)}`,
    );

    // Save raw reviews
    const reviewsToInsert = validData.map((row) => {
      const reviewText = mapping.reviewText ? row[mapping.reviewText] : null;
      const rating = mapping.rating ? row[mapping.rating] : null;
      const reviewerName = mapping.reviewerName
        ? row[mapping.reviewerName]
        : 'Anonymous';
      const dateRaw = mapping.reviewDate ? row[mapping.reviewDate] : null;
      const likesCount = mapping.likesCount ? row[mapping.likesCount] : null;

      let reviewDate = null;
      try {
        if (dateRaw) {
          if (dateRaw instanceof Date) {
            reviewDate = dateRaw;
          } else if (typeof dateRaw === 'number') {
            if (dateRaw < 100000) {
              // Excel serial date to JS Date
              reviewDate = new Date(
                Math.round((dateRaw - 25569) * 86400 * 1000),
              );
            } else {
              // UNIX timestamp
              reviewDate = new Date(dateRaw);
            }
          } else if (typeof dateRaw === 'string') {
            const parsedDate = new Date(dateRaw);
            if (!isNaN(parsedDate.getTime())) {
              reviewDate = parsedDate;
            }
          }
        }
      } catch {
        // Fallback if parsing fails
      }

      const reviewerNameText = stringifyField(reviewerName, 'Anonymous');
      const reviewTextText = reviewText ? stringifyField(reviewText) : null;
      const ratingText = rating ? stringifyField(rating) : null;
      const likesCountText = likesCount ? stringifyField(likesCount) : null;

      return {
        destinationId,
        scrapingJobId: job.id,
        reviewerName: reviewerNameText.substring(0, 255),
        reviewText: reviewTextText,
        rating: ratingText ? parseInt(ratingText, 10) : null,
        reviewDate,
        likesCount: likesCountText ? parseInt(likesCountText, 10) : 0,
        source: 'upload',
      };
    });

    await this.prisma.review.createMany({
      data: reviewsToInsert,
    });

    // Dispatch NLP processing
    await this.nlpQueue.add('process-nlp', {
      jobId: job.id,
      destinationId,
    });

    return {
      message: 'File uploaded and NLP processing started',
      job_id: job.id,
      total_rows: validData.length,
    };
  }
}
