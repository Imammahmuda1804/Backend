import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { ScraperService } from './scraper.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  HistoryQueryDto,
  JobQueryDto,
  SearchQueryDto,
  StartScrapingDto,
} from './dto';

type AdminUser = {
  id: number;
  email: string;
  role: string;
};

@ApiTags('Admin - Scraper')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/scraper')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  // Mencari tempat dari Google Maps.
  @Get('search')
  @ApiOperation({ summary: 'Cari tempat di Google Maps' })
  @ApiResponse({ status: 200, description: 'Hasil pencarian berhasil diambil' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN only' })
  async searchMaps(@Query() query: SearchQueryDto) {
    return this.scraperService.searchMaps(query.q);
  }

  // Memulai job scraping review.
  @Post('start')
  @ApiOperation({ summary: 'Mulai scraping review destinasi' })
  @ApiBody({ type: StartScrapingDto })
  @ApiResponse({ status: 201, description: 'Job scraping berhasil dibuat' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN only' })
  async startScraping(
    @Body() dto: StartScrapingDto,
    @CurrentUser() user?: AdminUser,
  ) {
    return this.scraperService.startScraping(dto, user?.id);
  }

  // Mengambil status job scraping.
  @Get('status/:jobId')
  @ApiOperation({ summary: 'Status job scraping' })
  @ApiResponse({ status: 200, description: 'Status job berhasil diambil' })
  @ApiResponse({ status: 404, description: 'Job tidak ditemukan' })
  async getJobStatus(@Param('jobId', ParseIntPipe) jobId: number) {
    return this.scraperService.getJobStatus(jobId);
  }

  // Mengambil daftar job scraping.
  @Get('jobs')
  @ApiOperation({ summary: 'List job scraping' })
  @ApiResponse({ status: 200, description: 'Daftar job berhasil diambil' })
  async getJobs(@Query() query: JobQueryDto) {
    return this.scraperService.getAllJobs(
      query.page ?? 1,
      query.limit ?? 10,
      query.status,
    );
  }

  // Mengambil riwayat review hasil scraping.
  @Get('history')
  @ApiOperation({ summary: 'Riwayat review hasil scraping' })
  @ApiResponse({
    status: 200,
    description: 'Riwayat scraping berhasil diambil',
  })
  async getHistory(@Query() query: HistoryQueryDto) {
    return this.scraperService.getHistory(
      query.page ?? 1,
      query.limit ?? 10,
      query.destination_id,
    );
  }

  // Mengunduh file Excel hasil scraping.
  @Get('download/:jobId')
  @ApiOperation({
    summary: 'Download hasil scraping sebagai file Excel (.xlsx)',
  })
  @ApiResponse({ status: 200, description: 'File Excel berhasil diunduh' })
  @ApiResponse({ status: 400, description: 'Job belum selesai' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
  @ApiResponse({ status: 404, description: 'Job atau file tidak ditemukan' })
  async downloadExcel(
    @Param('jobId', ParseIntPipe) jobId: number,
    @Res() res: Response,
  ) {
    const { filePath, filename } =
      await this.scraperService.downloadExcel(jobId);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(filename)}"`,
    );

    return res.sendFile(filePath);
  }
}
