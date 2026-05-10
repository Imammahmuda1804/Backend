import {
    Controller,
    Get,
    Param,
    Query,
    ParseIntPipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiQuery,
} from '@nestjs/swagger';
import { TopicsService } from './topics.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Topics')
@Public()
@Controller('topics')
export class TopicsController {
    constructor(private readonly topicsService: TopicsService) { }

    /**
     * GET /api/topics
     */
    @Get()
    @ApiOperation({ summary: 'List semua topics dengan jumlah destinasi' })
    @ApiResponse({ status: 200, description: 'Topics berhasil diambil' })
    async findAll() {
        return this.topicsService.findAll();
    }

    /**
     * GET /api/topics/:id/destinations
     */
    @Get(':id/destinations')
    @ApiOperation({ summary: 'Destinasi berdasarkan topic' })
    @ApiParam({ name: 'id', type: Number, description: 'Topic ID' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiResponse({ status: 200, description: 'Destinations berhasil diambil' })
    @ApiResponse({ status: 404, description: 'Topic tidak ditemukan' })
    async findDestinationsByTopic(
        @Param('id', ParseIntPipe) id: number,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const parsedPage = page ? parseInt(page, 10) : 1;
        const parsedLimit = limit ? Math.min(parseInt(limit, 10), 100) : 10;
        return this.topicsService.findDestinationsByTopic(id, parsedPage, parsedLimit);
    }
}
