import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { ScraperService } from './scraper.service';
import { SearchQueryDto, StartScrapingDto, JobQueryDto, HistoryQueryDto } from './dto';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin - Scraper')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/scraper')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  /**
   * Cari tempat wisata di Google Maps.
   * Parameter `q` bisa berupa:
   *  - Nama tempat  : "Pantai Kuta Bali"
   *  - URL Maps     : "https://maps.google.com/..."
   */
  @Get('search')
  @ApiOperation({
    summary: 'Cari tempat wisata di Google Maps',
    description:
      'Masukkan nama tempat atau URL Google Maps langsung. ' +
      'Hasil berisi nama, alamat, rating, dan URL untuk digunakan saat memulai scraping.',
  })
  @ApiQuery({
    name: 'q',
    description: 'Nama tempat atau URL Google Maps',
    example: 'Pantai Kuta Bali',
  })
  @ApiResponse({ status: 200, description: 'Daftar hasil pencarian dari Google Maps' })
  @ApiResponse({ status: 400, description: 'Query kosong atau pencarian gagal' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
  async searchMaps(@Query() query: SearchQueryDto) {
    return this.scraperService.searchMaps(query.q);
  }

  /**
   * Mulai scraping ulasan dari Google Maps.
   *
   * Filter yang sudah DIKUNCI (tidak perlu diisi):
   *  ✅ Sort     : terbaru (newest)
   *  ✅ Bintang  : semua bintang
   *  ✅ Has text : hanya ulasan yang mengandung teks
   *
   * Yang bisa dikontrol admin:
   *  - max_reviews : batas jumlah ulasan (opsional)
   *  - maps_url    : override URL Maps jika berbeda dari yang tersimpan di DB (opsional)
   */
  @Post('start')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Mulai scraping ulasan dari Google Maps',
    description:
      'Memulai job scraping untuk destinasi yang dipilih. ' +
      'Ulasan yang diambil: terbaru, semua bintang, hanya yang berteks. ' +
      'Gunakan max_reviews untuk membatasi jumlah ulasan yang diambil.',
  })
  @ApiResponse({ status: 202, description: 'Scraping job berhasil dimulai dan masuk antrian' })
  @ApiResponse({ status: 400, description: 'Destinasi tidak memiliki URL Google Maps' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
  @ApiResponse({ status: 404, description: 'Destinasi tidak ditemukan' })
  async startScraping(@Body() dto: StartScrapingDto, @Req() req: Request) {
    const user = req.user as any;
    const adminId = user?.id;
    return this.scraperService.startScraping(dto, adminId);
  }

  @Get('status/:jobId')
  @ApiOperation({ summary: 'Cek status scraping job (polling)' })
  @ApiResponse({ status: 200, description: 'Status job berhasil diambil' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
  @ApiResponse({ status: 404, description: 'Job tidak ditemukan' })
  async getJobStatus(@Param('jobId', ParseIntPipe) jobId: number) {
    return this.scraperService.getJobStatus(jobId);
  }

  @Get('jobs')
  @ApiOperation({ summary: 'Daftar semua scraping job (terbaru di atas)' })
  @ApiResponse({ status: 200, description: 'Paginated list of scraping jobs' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
  async getJobs(@Query() query: JobQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    return this.scraperService.getAllJobs(page, limit, query.status);
  }

  @Get('history')
  @ApiOperation({ summary: 'Riwayat scraping per destinasi' })
  @ApiResponse({ status: 200, description: 'Paginated scraping history' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
  async getHistory(@Query() query: HistoryQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    return this.scraperService.getHistory(page, limit, query.destination_id);
  }

  @Get('download/:jobId')
  @ApiOperation({ summary: 'Download hasil scraping sebagai file CSV' })
  @ApiResponse({ status: 200, description: 'File CSV berhasil diunduh' })
  @ApiResponse({ status: 400, description: 'Job belum selesai' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
  @ApiResponse({ status: 404, description: 'Job tidak ditemukan' })
  async downloadCsv(
    @Param('jobId', ParseIntPipe) jobId: number,
    @Res() res: Response,
  ) {
    const csvData = await this.scraperService.downloadCsv(jobId);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="reviews_job_${jobId}.csv"`,
    );

    return res.send(csvData);
  }

  @Post('process/:jobId')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Trigger NLP pipeline untuk memproses ulasan job ini' })
  @ApiResponse({ status: 202, description: 'NLP processing berhasil dimulai' })
  @ApiResponse({ status: 400, description: 'Job belum selesai' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
  @ApiResponse({ status: 404, description: 'Job tidak ditemukan' })
  async processNlp(@Param('jobId', ParseIntPipe) jobId: number) {
    return this.scraperService.processNlp(jobId);
  }
}
