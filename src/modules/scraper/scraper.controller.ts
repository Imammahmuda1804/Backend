import { Controller, Get, Param, ParseIntPipe, Res } from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { ScraperService } from './scraper.service';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin - Scraper')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/scraper')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

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
