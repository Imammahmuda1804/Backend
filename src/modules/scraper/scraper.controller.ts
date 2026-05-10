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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ScraperService } from './scraper.service';
import {
  SearchQueryDto,
  StartScrapingDto,
  JobQueryDto,
  HistoryQueryDto,
} from './dto';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin - Scraper')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/scraper')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) { }

  @Get('search')
  @ApiOperation({ summary: 'Cari tempat wisata di Google Maps via Apify' })
  @ApiResponse({ status: 200, description: 'Search results from Google Maps' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
  async searchMaps(@Query() query: SearchQueryDto) {
    const results = await this.scraperService.searchMaps(query.q);
    return results;
  }

  @Post('start')
  @HttpCode(HttpStatus.ACCEPTED) // 202
  @ApiOperation({ summary: 'Trigger scraping reviews dari Google Maps' })
  @ApiResponse({ status: 202, description: 'Scraping job started' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
  @ApiResponse({ status: 404, description: 'Destination not found' })
  async startScraping(@Body() dto: StartScrapingDto, @Req() req: Request) {
    const user = req.user as any;
    const adminId = user?.id;
    return this.scraperService.startScraping(dto, adminId);
  }

  @Get('status/:jobId')
  @ApiOperation({ summary: 'Polling scraping progress' })
  @ApiResponse({ status: 200, description: 'Job status retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJobStatus(@Param('jobId', ParseIntPipe) jobId: number) {
    return this.scraperService.getJobStatus(jobId);
  }

  @Get('jobs')
  @ApiOperation({ summary: 'List semua scraping jobs' })
  @ApiResponse({ status: 200, description: 'Paginated list of scraping jobs' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
  async getJobs(@Query() query: JobQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    return this.scraperService.getAllJobs(page, limit, query.status);
  }

  @Get('history')
  @ApiOperation({ summary: 'Riwayat scraping per destination' })
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
  @ApiResponse({ status: 200, description: 'CSV file downloaded' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
  @ApiResponse({ status: 404, description: 'Job not found or no reviews' })
  async downloadCsv(
    @Param('jobId', ParseIntPipe) jobId: number,
    @Res() res: Response,
  ) {
    const csvData = await this.scraperService.downloadCsv(jobId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="reviews_job_${jobId}.csv"`,
    );

    return res.send(csvData);
  }

  @Post('process/:jobId')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Trigger NLP pipeline processing' })
  @ApiResponse({ status: 202, description: 'NLP processing started' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async processNlp(@Param('jobId', ParseIntPipe) jobId: number) {
    return this.scraperService.processNlp(jobId);
  }
}
