import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApifyService } from './apify.service';
import { CsvService } from './csv.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { StartScrapingDto } from './dto';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly apifyService: ApifyService,
    private readonly csvService: CsvService,
    @InjectQueue('scraping-queue') private readonly scrapingQueue: Queue,
    @InjectQueue('nlp-queue') private readonly nlpQueue: Queue,
  ) {}

  /**
   * Mencari tempat di Google Maps.
   * Mendukung pencarian via teks biasa atau URL Google Maps langsung.
   */
  async searchMaps(query: string) {
    if (!query || query.trim() === '') {
      throw new BadRequestException('Query parameter (q) is required');
    }
    try {
      const results = await this.apifyService.searchPlaces(query.trim());
      return results;
    } catch (error: unknown) {
      this.logger.error('Error searching maps', error);
      throw new BadRequestException('Failed to search maps via Apify');
    }
  }

  /**
   * Memulai scraping ulasan untuk destinasi tertentu.
   *
   * Aturan filter yang DIKUNCI (tidak bisa diubah dari request):
   *  - Sort     : newest
   *  - Bintang  : semua (tanpa filter)
   *  - Has text : true
   *
   * Yang bisa dikontrol admin:
   *  - max_reviews : batas jumlah ulasan (opsional)
   *  - maps_url    : override URL Maps (opsional, fallback ke DB)
   */
  async startScraping(dto: StartScrapingDto, adminId?: number) {
    const destination = await this.prisma.destination.findUnique({
      where: { id: dto.destination_id },
    });

    if (!destination) {
      throw new NotFoundException('Destination not found');
    }

    // Gunakan maps_url dari request jika ada, fallback ke URL yang ada di DB
    const finalMapsUrl = dto.maps_url || destination.googleMapsUrl;

    if (!finalMapsUrl) {
      throw new BadRequestException(
        'Destinasi belum memiliki URL Google Maps. Sertakan maps_url pada request.',
      );
    }

    const job = await this.prisma.scrapingJob.create({
      data: {
        destinationId: destination.id,
        status: 'pending',
        createdBy: adminId,
      },
    });

    // Hanya teruskan data yang diperlukan — filter dikunci di processor/apify service
    await this.scrapingQueue.add('scrape-reviews', {
      jobId: job.id,
      destinationId: destination.id,
      url: finalMapsUrl,
      maxReviews: dto.max_reviews,
    });

    this.logger.log(
      `Scraping job #${job.id} queued for destination "${destination.name}" (maxReviews: ${dto.max_reviews ?? 'ALL'})`,
    );

    return {
      job_id: job.id,
      status: 'pending',
      destination_name: destination.name,
      maps_url: finalMapsUrl,
      message: 'Scraping job started. Ulasan akan diambil: terbaru, semua bintang, hanya yang berteks.',
    };
  }

  async getJobStatus(jobId: number) {
    const job = await this.prisma.scrapingJob.findUnique({
      where: { id: jobId },
      include: {
        destination: {
          select: { name: true, city: true, province: true },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Scraping job not found');
    }

    return job;
  }

  async getAllJobs(page: number, limit: number, status?: string) {
    const skip = (page - 1) * limit;
    const whereCondition = status ? { status } : {};

    const [data, total] = await Promise.all([
      this.prisma.scrapingJob.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          destination: {
            select: { name: true, city: true },
          },
        },
      }),
      this.prisma.scrapingJob.count({ where: whereCondition }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async getHistory(page: number, limit: number, destinationId?: number) {
    const skip = (page - 1) * limit;
    const whereCondition = destinationId ? { destinationId } : {};

    const [data, total] = await Promise.all([
      this.prisma.scrapingHistory.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          destination: {
            select: { name: true },
          },
          job: true,
        },
      }),
      this.prisma.scrapingHistory.count({ where: whereCondition }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async downloadCsv(jobId: number) {
    const job = await this.prisma.scrapingJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Scraping job not found');
    }

    if (job.status !== 'completed') {
      throw new BadRequestException('Job is not completed yet');
    }

    const reviews = await this.prisma.review.findMany({
      where: { scrapingJobId: jobId },
      select: {
        id: true,
        reviewerName: true,
        rating: true,
        reviewText: true,
        reviewDate: true,
        likesCount: true,
      },
    });

    const csvData = this.csvService.generateCsv(reviews);
    return csvData;
  }

  async processNlp(jobId: number) {
    const job = await this.prisma.scrapingJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Scraping job not found');
    }

    if (job.status !== 'completed') {
      throw new BadRequestException('Job is not completed yet');
    }

    await this.nlpQueue.add('process-nlp', {
      jobId,
      destinationId: job.destinationId,
    });

    return {
      message: 'NLP processing started',
      job_id: jobId,
    };
  }
}
