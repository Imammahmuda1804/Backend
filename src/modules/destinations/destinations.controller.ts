import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DestinationsService } from './destinations.service';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { DestinationQueryDto } from './dto/destination-query.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Public - Destinations')
@Public()
@Controller('destinations')
export class DestinationsController {
  constructor(private readonly destinationsService: DestinationsService) { }

  @Get()
  @ApiOperation({ summary: 'Get all destinations with filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of destinations' })
  async findAll(@Query() query: DestinationQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    return this.destinationsService.findAll(
      page,
      limit,
      query.search,
      query.topic_id,
    );
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Get recommended destinations' })
  @ApiResponse({ status: 200, description: 'Paginated list of recommended destinations' })
  async getRecommendations(@Query() query: PaginationQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    return this.destinationsService.findRecommendations(page, limit);
  }

  @Get('ranking')
  @ApiOperation({ summary: 'Get top destinations ranking' })
  @ApiResponse({ status: 200, description: 'List of top ranked destinations' })
  async getRanking(
    @Query('sort_by') sortBy: string,
    @Query('limit') limit: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.destinationsService.findRanking(sortBy, parsedLimit);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get public destination detail by slug' })
  @ApiResponse({ status: 200, description: 'Destination detail with analytics' })
  @ApiResponse({ status: 404, description: 'Destination not found' })
  async getDetailBySlug(@Param('slug') slug: string) {
    return this.destinationsService.findOnePublicBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get public destination detail' })
  @ApiResponse({ status: 200, description: 'Destination detail with analytics' })
  @ApiResponse({ status: 404, description: 'Destination not found' })
  async getDetail(@Param('id', ParseIntPipe) id: number) {
    return this.destinationsService.findOnePublic(id);
  }
}
