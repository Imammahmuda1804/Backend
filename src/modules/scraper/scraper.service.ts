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
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly apifyService: ApifyService,
    private readonly csvService: CsvService,
    @InjectQueue('scraping-queue') private readonly scrapingQueue: Queue,
  ) {}

  // Mencari tempat di Google Maps.
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

  // Memulai scraping ulasan destinasi.
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

    // Kirim data ke queue — termasuk nama destinasi untuk penamaan file
    await this.scrapingQueue.add('scrape-reviews', {
      jobId: job.id,
      destinationId: destination.id,
      destinationName: destination.name,
      url: finalMapsUrl,
      maxReviews: dto.max_reviews,
    });

    this.logger.log(
      `Scraping job #${job.id} queued for destination "${destination.name}" (target: ${dto.max_reviews ?? 'ALL'} text reviews)`,
    );

    return {
      job_id: job.id,
      status: 'pending',
      destination_name: destination.name,
      maps_url: finalMapsUrl,
      message:
        'Scraping job dimulai. Sistem akan mengambil ulasan berteks sesuai jumlah yang diminta. Hasil berupa file Excel yang bisa diunduh.',
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

  // Mengunduh file Excel hasil scraping.
  async downloadExcel(
    jobId: number,
  ): Promise<{ filePath: string; filename: string }> {
    const job = await this.prisma.scrapingJob.findUnique({
      where: { id: jobId },
      include: {
        destination: { select: { name: true } },
      },
    });

    if (!job) {
      throw new NotFoundException('Scraping job not found');
    }

    if (job.status !== 'completed') {
      throw new BadRequestException('Job belum selesai');
    }

    const uploadDir = path.join(process.cwd(), 'uploads', 'scraped_data');
    const jobFilePath = path.join(uploadDir, `job_${jobId}.xlsx`);

    if (!fs.existsSync(jobFilePath)) {
      throw new NotFoundException(
        'File Excel tidak ditemukan. Mungkin sudah dihapus.',
      );
    }

    // Membuat nama file download.
    const safeName = (job.destination?.name || 'Destination')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 40);
    const dateStr = new Date(job.createdAt)
      .toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      .replace(/ /g, '-');

    const filename = `[RanahInsight]_Scrape_${safeName}_${job.totalReviews || 0}_Reviews_${dateStr}.xlsx`;

    return { filePath: jobFilePath, filename };
  }
}
