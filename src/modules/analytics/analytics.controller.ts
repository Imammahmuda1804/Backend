import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { CompareQueryDto, TrendsQueryDto } from './dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Analytics - Public')
@Public()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}
  @Get('dashboard')
  @ApiOperation({ summary: 'Public analytics dashboard' })
  @ApiResponse({ status: 200, description: 'Dashboard stats berhasil diambil' })
  async getDashboard() {
    return this.analyticsService.getPublicDashboard();
  }
  @Get('destination/:id')
  @ApiOperation({ summary: 'Analytics lengkap untuk satu destinasi' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Analytics berhasil diambil' })
  @ApiResponse({ status: 404, description: 'Destinasi tidak ditemukan' })
  async getDestinationAnalytics(@Param('id', ParseIntPipe) id: number) {
    return this.analyticsService.getDestinationAnalytics(id);
  }

  @Get('destination/:id/topics')
  @ApiOperation({ summary: 'Topic distribution untuk satu destinasi' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Topic distribution berhasil diambil',
  })
  @ApiResponse({ status: 404, description: 'Destinasi tidak ditemukan' })
  async getDestinationTopics(@Param('id', ParseIntPipe) id: number) {
    return this.analyticsService.getDestinationTopics(id);
  }

  @Get('trends/:id')
  @ApiOperation({ summary: 'Trend sentimen untuk satu destinasi' })
  @ApiParam({ name: 'id', type: Number })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['daily', 'weekly', 'monthly'],
    description: 'Periode agregasi trend',
  })
  @ApiResponse({ status: 200, description: 'Trend data berhasil diambil' })
  @ApiResponse({ status: 404, description: 'Destinasi tidak ditemukan' })
  async getDestinationTrends(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: TrendsQueryDto,
  ) {
    return this.analyticsService.getDestinationTrends(id, query.period);
  }
  @Get('compare')
  @ApiOperation({ summary: 'Perbandingan dua destinasi' })
  @ApiResponse({ status: 200, description: 'Perbandingan berhasil' })
  @ApiResponse({
    status: 400,
    description: 'Salah satu destinasi tidak ditemukan',
  })
  async compareDestinations(@Query() query: CompareQueryDto) {
    return this.analyticsService.compareDestinations(
      query.destination1,
      query.destination2,
    );
  }
}
