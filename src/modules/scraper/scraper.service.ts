import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { ApifyService } from './apify.service';
import { StartScrapingDto } from './dto';

type ScraperDestination = {
  id: number;
  name: string;
  googleMapsUrl: string | null;
};

type ScrapingJobForDownload = {
  id: number;
  status: string;
  createdAt: Date;
  totalReviews: number | null;
  destination: { name: string } | null;
};

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly apifyService: ApifyService,
    @InjectQueue('scraping-queue') private readonly scrapingQueue: Queue,
  ) {}

  // Mencari tempat di Google Maps.
  async searchMaps(query: string) {
    if (!query || query.trim() === '') {
      throw new BadRequestException('Query parameter (q) is required');
    }
    try {
      return await this.apifyService.searchPlaces(query.trim());
    } catch (error: unknown) {
      const readableError = this.apifyService.toReadableError(error);
      this.logger.error(`Error searching maps: ${readableError}`, error);
      throw new BadRequestException(readableError);
    }
  }

  // Memulai scraping ulasan destinasi.
  async startScraping(dto: StartScrapingDto, adminId?: number) {
    const destination = await this.findScraperDestination(dto.destination_id);
    const finalMapsUrl = this.resolveMapsUrl(dto, destination);
    const effectiveMaxReviews = this.resolveMaxReviews(dto);
    const job = await this.createPendingScrapingJob(destination.id, adminId);

    await this.enqueueScrapingJob(
      job.id,
      destination,
      finalMapsUrl,
      effectiveMaxReviews,
    );
    this.logQueuedJob(job.id, destination.name, effectiveMaxReviews);

    return this.buildStartScrapingResponse(
      job.id,
      destination.name,
      finalMapsUrl,
    );
  }

  private async findScraperDestination(
    destinationId: number,
  ): Promise<ScraperDestination> {
    const destination = await this.prisma.destination.findUnique({
      where: { id: destinationId },
      select: { id: true, name: true, googleMapsUrl: true },
    });

    if (!destination) throw new NotFoundException('Destination not found');
    return destination;
  }

  private resolveMapsUrl(
    dto: StartScrapingDto,
    destination: ScraperDestination,
  ) {
    const finalMapsUrl = dto.maps_url || destination.googleMapsUrl;

    if (!finalMapsUrl) {
      throw new BadRequestException(
        'Destinasi belum memiliki URL Google Maps. Sertakan maps_url pada request.',
      );
    }
    return finalMapsUrl;
  }

  private resolveMaxReviews(dto: StartScrapingDto) {
    return dto.fetch_all_reviews ? undefined : dto.max_reviews;
  }

  private createPendingScrapingJob(destinationId: number, adminId?: number) {
    return this.prisma.scrapingJob.create({
      data: {
        destinationId,
        status: 'pending',
        createdBy: adminId,
      },
    });
  }

  private enqueueScrapingJob(
    jobId: number,
    destination: ScraperDestination,
    finalMapsUrl: string,
    effectiveMaxReviews?: number,
  ) {
    return this.scrapingQueue.add('scrape-reviews', {
      jobId,
      destinationId: destination.id,
      destinationName: destination.name,
      url: finalMapsUrl,
      maxReviews: effectiveMaxReviews,
    });
  }

  private logQueuedJob(
    jobId: number,
    destinationName: string,
    effectiveMaxReviews?: number,
  ) {
    this.logger.log(
      `Scraping job #${jobId} queued for destination "${destinationName}" (target: ${effectiveMaxReviews ?? 'ALL'} text reviews)`,
    );
  }

  private buildStartScrapingResponse(
    jobId: number,
    destinationName: string,
    mapsUrl: string,
  ) {
    return {
      job_id: jobId,
      status: 'pending',
      destination_name: destinationName,
      maps_url: mapsUrl,
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
            select: { name: true, city: true, province: true },
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
    const job = await this.findCompletedScrapingJob(jobId);
    const jobFilePath = this.resolveScrapedExcelPath(jobId);
    const filename = this.buildDownloadExcelFileName(job);

    return { filePath: jobFilePath, filename };
  }

  private async findCompletedScrapingJob(
    jobId: number,
  ): Promise<ScrapingJobForDownload> {
    const job = await this.prisma.scrapingJob.findUnique({
      where: { id: jobId },
      include: {
        destination: { select: { name: true } },
      },
    });

    if (!job) throw new NotFoundException('Scraping job not found');
    if (job.status !== 'completed') {
      throw new BadRequestException('Job belum selesai');
    }
    return job;
  }

  private resolveScrapedExcelPath(jobId: number) {
    if (!Number.isSafeInteger(jobId) || jobId <= 0) {
      throw new BadRequestException('Job ID tidak valid');
    }

    const uploadDir = path.join(process.cwd(), 'uploads', 'scraped_data');
    const jobFilePath = path.join(uploadDir, `job_${jobId}.xlsx`);

    if (!fs.existsSync(jobFilePath)) {
      throw new NotFoundException(
        'File Excel tidak ditemukan. Mungkin sudah dihapus.',
      );
    }

    return jobFilePath;
  }

  private buildDownloadExcelFileName(job: ScrapingJobForDownload) {
    const safeName = this.toSafeFileName(job.destination?.name);
    const dateStr = this.toDownloadDate(job.createdAt);
    const reviewCount = job.totalReviews || 0;
    return `[RanahInsight]_Scrape_${safeName}_${reviewCount}_Reviews_${dateStr}.xlsx`;
  }

  private toSafeFileName(value?: string) {
    return (value || 'Destination')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 40);
  }

  private toDownloadDate(value: Date) {
    return new Date(value)
      .toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      .replace(/ /g, '-');
  }
}
