import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { TrendsQueryDto } from './dto';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin - Analytics')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin')
export class AdminAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // ── Task 8.1 ──────────────────────────────────────────────────

  @Get('dashboard/summary')
  @ApiOperation({ summary: 'Admin dashboard summary' })
  @ApiResponse({ status: 200, description: 'Summary berhasil diambil' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
  async getAdminSummary() {
    return this.analyticsService.getAdminSummary();
  }

  @Get('dashboard/activity')
  @ApiOperation({ summary: 'Recent activity untuk admin dashboard' })
  @ApiResponse({ status: 200, description: 'Activity berhasil diambil' })
  async getAdminActivity() {
    return this.analyticsService.getAdminActivity();
  }

  @Get('dashboard/trends')
  @ApiOperation({ summary: 'Trend data (daily/weekly/monthly)' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['daily', 'weekly', 'monthly'],
  })
  @ApiResponse({ status: 200, description: 'Trend data berhasil diambil' })
  async getAdminTrends(@Query() query: TrendsQueryDto) {
    return this.analyticsService.getAdminTrends(query.period);
  }

  // ── Task 8.3 ──────────────────────────────────────────────────

  @Get('analytics/export/:destinationId')
  @ApiOperation({ summary: 'Export analytics destinasi sebagai CSV' })
  @ApiParam({ name: 'destinationId', type: Number })
  @ApiResponse({ status: 200, description: 'CSV file berhasil didownload' })
  @ApiResponse({ status: 404, description: 'Destinasi tidak ditemukan' })
  async exportCsv(
    @Param('destinationId', ParseIntPipe) destinationId: number,
    @Res() res: Response,
  ) {
    const { csv, filename } =
      await this.analyticsService.exportAnalyticsCsv(destinationId);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }
}
