import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { ApifyService } from './apify.service';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

interface ScrapingJobData {
  jobId: number;
  destinationId: number;
  url: string;
  maxReviews?: number;
  destinationName?: string;
}

interface ScrapingJobResult {
  status: 'success';
  savedCount: number;
  filePath: string;
}

interface ScrapedReviewItem {
  text?: string;
  reviewText?: string;
  stars?: number;
  rating?: number;
  name?: string;
  reviewerName?: string;
  publishedAtDate?: string;
  date?: string;
  likesCount?: number;
  responseFromOwnerText?: string;
}

@Processor('scraping-queue')
export class ScraperProcessor extends WorkerHost {
  private readonly logger = new Logger(ScraperProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly apifyService: ApifyService,
  ) {
    super();
  }

  async process(
    job: Job<ScrapingJobData, ScrapingJobResult, string>,
  ): Promise<ScrapingJobResult> {
    const { jobId, destinationId, url, maxReviews, destinationName } = job.data;

    this.logger.log(
      `Processing scraping job ${jobId} for destination ${destinationId}`,
    );

    await this.prisma.scrapingJob.update({
      where: { id: jobId },
      data: { status: 'running', startedAt: new Date() },
    });

    try {
      // Ambil Google Maps Rating dari destination info terlebih dahulu
      await this.fetchAndSaveGoogleRating(destinationId, url);

      // Request lebih banyak ulasan agar setelah difilter yang berteks,
      // kita masih mendapatkan jumlah yang diminta
      const oversampledMax = maxReviews ? maxReviews * 3 : undefined;

      const apifyRun = await this.apifyService.startReviewScraping(
        url,
        oversampledMax,
      );

      const runId = apifyRun.id;
      this.logger.log(`Waiting for Apify run ${runId} to finish...`);

      const finishedRun = await this.apifyService.waitForRun(runId);
      const runStatus = finishedRun.status;
      const datasetId = finishedRun.defaultDatasetId;

      if (runStatus !== 'SUCCEEDED') {
        throw new Error(`Apify run failed with status: ${runStatus}`);
      }

      this.logger.log(`Fetching results from dataset ${datasetId}...`);
      const results = (await this.apifyService.getRunResults(
        datasetId,
      )) as ScrapedReviewItem[];

      this.logger.log(
        `Got ${results.length} raw results. Filtering text-only reviews...`,
      );

      // Filter: hanya review yang punya teks dan rating
      const textReviews = results.filter((item) => {
        const reviewText = item.text || item.reviewText || null;
        const rating = item.stars || item.rating || null;
        return reviewText && reviewText.trim().length > 0 && rating;
      });

      // Potong sesuai jumlah yang diminta
      const finalReviews = maxReviews
        ? textReviews.slice(0, maxReviews)
        : textReviews;

      this.logger.log(
        `Filtered to ${finalReviews.length} text reviews (requested: ${maxReviews ?? 'ALL'})`,
      );

      // Membuat file Excel tanpa menyimpan review ke database.
      const filePath = await this.generateExcel(
        finalReviews,
        jobId,
        destinationId,
        destinationName || 'Destination',
      );
      await this.prisma.scrapingJob.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          finishedAt: new Date(),
          totalReviews: finalReviews.length,
        },
      });

      // Catat history
      await this.prisma.scrapingHistory.create({
        data: {
          destinationId,
          jobId,
          totalReviews: finalReviews.length,
          hasText: true,
          sort: 'newest',
        },
      });

      this.logger.log(
        `Successfully finished scraping job ${jobId}, generated Excel with ${finalReviews.length} reviews at ${filePath}`,
      );
      return { status: 'success', savedCount: finalReviews.length, filePath };
    } catch (error: unknown) {
      this.logger.error(`Error in scraping job ${jobId}`, error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      await this.prisma.scrapingJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          finishedAt: new Date(),
          errorMessage,
        },
      });

      throw error;
    }
  }

  // Mengambil rating Google Maps jika belum tersedia.
  private async fetchAndSaveGoogleRating(
    destinationId: number,
    mapsUrl: string,
  ) {
    try {
      const dest = await this.prisma.destination.findUnique({
        where: { id: destinationId },
        select: { googleRating: true, googleReviewCount: true },
      });

      // Ambil rating hanya jika belum tersedia.
      if (dest?.googleRating !== null && dest?.googleRating !== undefined) {
        this.logger.log(
          `Destination ${destinationId} already has Google rating: ${dest.googleRating}`,
        );
        return;
      }

      this.logger.log(
        `Fetching Google Maps info for destination ${destinationId}...`,
      );
      const places = await this.apifyService.searchPlaces(mapsUrl);

      if (places.length > 0) {
        const place = places[0];
        await this.prisma.destination.update({
          where: { id: destinationId },
          data: {
            googleRating: place.rating ?? null,
            googleReviewCount: place.totalReviews ?? null,
          },
        });
        this.logger.log(
          `Saved Google Rating: ${place.rating}, Review Count: ${place.totalReviews}`,
        );
      }
    } catch (err) {
      // Jangan gagalkan job untuk proses non-kritis.
      this.logger.warn(
        `Failed to fetch Google rating (non-critical): ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  // Membuat file Excel dari hasil scraping.
  private async generateExcel(
    reviews: ScrapedReviewItem[],
    jobId: number,
    destinationId: number,
    destinationName: string,
  ): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'RanahInsight';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Ulasan', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });
    sheet.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Nama Pengulas', key: 'reviewerName', width: 22 },
      { header: 'Rating', key: 'rating', width: 10 },
      { header: 'Teks Ulasan', key: 'reviewText', width: 60 },
      { header: 'Tanggal Ulasan', key: 'reviewDate', width: 18 },
      { header: 'Jumlah Suka', key: 'likesCount', width: 14 },
      { header: 'Balasan Pemilik', key: 'ownerReply', width: 40 },
    ];
    const headerRow = sheet.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.font = {
        name: 'Calibri',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2D82B5' },
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF1A5276' } },
        bottom: { style: 'thin', color: { argb: 'FF1A5276' } },
        left: { style: 'thin', color: { argb: 'FF1A5276' } },
        right: { style: 'thin', color: { argb: 'FF1A5276' } },
      };
    });
    reviews.forEach((item, index) => {
      const reviewText = item.text || item.reviewText || '';
      const rating = item.stars || item.rating || 0;
      const reviewerName = item.name || item.reviewerName || 'Anonymous';
      const reviewDateStr = item.publishedAtDate || item.date || null;
      const reviewDate = reviewDateStr
        ? new Date(reviewDateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : '-';
      const likesCount = item.likesCount || 0;
      const ownerReply = item.responseFromOwnerText || '-';

      const row = sheet.addRow({
        no: index + 1,
        reviewerName,
        rating,
        reviewText,
        reviewDate,
        likesCount,
        ownerReply,
      });

      // Warna baris bergantian.
      const bgColor = index % 2 === 0 ? 'FFFFFFFF' : 'FFF8F9FA';
      const borderColor = { argb: 'FFE2E8F0' };

      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Calibri', size: 10 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgColor },
        };
        cell.border = {
          top: { style: 'thin', color: borderColor },
          bottom: { style: 'thin', color: borderColor },
          left: { style: 'thin', color: borderColor },
          right: { style: 'thin', color: borderColor },
        };

        // Mengatur alignment kolom.
        if (colNumber === 4 || colNumber === 7) {
          // Teks Ulasan & Balasan Pemilik — left align, wrap
          cell.alignment = {
            vertical: 'middle',
            horizontal: 'left',
            wrapText: true,
          };
        } else {
          // Kolom data lain — center
          cell.alignment = {
            vertical: 'middle',
            horizontal: 'center',
            wrapText: true,
          };
        }

        // Warna rating berdasarkan nilai
        if (colNumber === 3) {
          cell.font = {
            name: 'Calibri',
            size: 10,
            bold: true,
            color: {
              argb:
                rating >= 4
                  ? 'FF16A34A'
                  : rating >= 3
                    ? 'FFCA8A04'
                    : 'FFDC2626',
            },
          };
        }
      });
    });
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: reviews.length + 1, column: 7 },
    };

    // Menyimpan file hasil scraping.
    const uploadDir = path.join(process.cwd(), 'uploads', 'scraped_data');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Membuat nama file yang mudah dilacak.
    const safeName = destinationName
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 40);
    const dateStr = new Date()
      .toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      .replace(/ /g, '-');

    const filename = `[RanahInsight]_Scrape_${safeName}_${reviews.length}_Reviews_${dateStr}.xlsx`;
    const filePath = path.join(uploadDir, filename);

    await workbook.xlsx.writeFile(filePath);

    // Simpan path file untuk download.
    // Jadi kita juga buat symlink/copy dengan nama job_{jobId}.xlsx
    const jobFilePath = path.join(uploadDir, `job_${jobId}.xlsx`);
    if (fs.existsSync(jobFilePath)) {
      fs.unlinkSync(jobFilePath);
    }
    fs.copyFileSync(filePath, jobFilePath);

    this.logger.log(`Excel file saved: ${filename}`);
    return filePath;
  }
}
