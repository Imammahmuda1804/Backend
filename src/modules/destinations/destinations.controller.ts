import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DestinationsService } from './destinations.service';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { DestinationQueryDto } from './dto/destination-query.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Public - Destinations')
@Public()
@Controller('destinations')
export class DestinationsController {
  constructor(private readonly destinationsService: DestinationsService) {}

  @Get('cities')
  @ApiOperation({ summary: 'Get list of unique cities' })
  @ApiResponse({ status: 200, description: 'List of city names' })
  async getCities() {
    return this.destinationsService.getCities();
  }

  @Get()
  @ApiOperation({ summary: 'Get all destinations with filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of destinations' })
  async findAll(@Query() query: DestinationQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    // Parse topic_ids comma-separated string to number array
    const topicIds = query.topic_ids
      ? query.topic_ids
          .split(',')
          .map(Number)
          .filter((n) => !isNaN(n))
      : undefined;

    return this.destinationsService.findAll(
      page,
      limit,
      query.search,
      query.topic_id,
      topicIds,
      query.city,
    );
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Get recommended destinations' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of recommended destinations',
  })
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
  @ApiResponse({
    status: 200,
    description: 'Destination detail with analytics',
  })
  @ApiResponse({ status: 404, description: 'Destination not found' })
  async getDetailBySlug(@Param('slug') slug: string) {
    return this.destinationsService.findOnePublicBySlug(slug);
  }

  @Get(':id/reviews-by-topic')
  @ApiOperation({
    summary: 'Get scraped reviews by topic',
    description:
      'Returns paginated scraped reviews for a destination filtered by topic ID. ' +
      'Used by the frontend Topic Insight panel to show related reviews when a topic is clicked.',
  })
  @ApiQuery({
    name: 'topicId',
    required: true,
    type: Number,
    description: 'Topic ID to filter reviews',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 5)',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of scraped reviews for the given topic',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              reviewerName: { type: 'string' },
              reviewText: { type: 'string' },
              rating: { type: 'number' },
              reviewDate: { type: 'string', format: 'date-time' },
              sentiment: { type: 'string' },
              likesCount: { type: 'number' },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Destination not found' })
  async getReviewsByTopic(
    @Param('id', ParseIntPipe) id: number,
    @Query('topicId') topicIdStr: string,
    @Query('page') pageStr: string,
    @Query('limit') limitStr: string,
  ) {
    const topicId = parseInt(topicIdStr, 10);
    const page = parseInt(pageStr, 10) || 1;
    const limit = parseInt(limitStr, 10) || 5;
    return this.destinationsService.getReviewsByTopic(id, topicId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get public destination detail' })
  @ApiResponse({
    status: 200,
    description: 'Destination detail with analytics',
  })
  @ApiResponse({ status: 404, description: 'Destination not found' })
  async getDetail(@Param('id', ParseIntPipe) id: number) {
    return this.destinationsService.findOnePublic(id);
  }
}
