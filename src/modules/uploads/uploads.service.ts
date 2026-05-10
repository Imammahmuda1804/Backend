import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FileParserService } from './file-parser.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class UploadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileParser: FileParserService,
    @InjectQueue('nlp-queue') private readonly nlpQueue: Queue,
  ) { }

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

    // Save raw reviews
    const reviewsToInsert = (validData as Record<string, unknown>[]).map(
      (row) => {
        // Basic heuristic to find matching columns (English & Indonesian)
        const getVal = (keys: string[]): unknown => {
          const foundKey = Object.keys(row).find((k) =>
            keys.some((searchKey) => k.toLowerCase().includes(searchKey)),
          );
          return foundKey ? row[foundKey] : null;
        };

        // Support both English and Indonesian column names
        const reviewText = getVal([
          'text',
          'review',
          'content',
          'ulasan',
          'teks',
          'komentar',
        ]);
        const rating = getVal(['rating', 'star', 'score', 'nilai', 'bintang']);
        const reviewerName =
          getVal(['name', 'author', 'user', 'nama', 'penulis']) || 'Anonymous';
        const dateRaw = getVal([
          'date',
          'time',
          'published',
          'tanggal',
          'waktu',
        ]);
        const likesCount = getVal(['like', 'helpful', 'suka', 'berguna']);

        let reviewDate = null;
        if (
          dateRaw &&
          (typeof dateRaw === 'string' || typeof dateRaw === 'number')
        ) {
          const parsedDate = new Date(dateRaw);
          if (!isNaN(parsedDate.getTime())) {
            reviewDate = parsedDate;
          }
        }

        return {
          destinationId,
          scrapingJobId: job.id,
          reviewerName: String(reviewerName).substring(0, 255),
          reviewText: reviewText ? String(reviewText) : null,
          rating: rating ? parseInt(String(rating), 10) : null,
          reviewDate,
          likesCount: likesCount ? parseInt(String(likesCount), 10) : 0,
          source: 'upload',
        };
      },
    );

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
