import {
  Controller,
  Get,
  Delete,
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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TopicsService } from './topics.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Topics')
@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  // Mengambil daftar topik sesuai scope tampilan.
  @Get()
  @Public()
  @ApiOperation({ summary: 'List semua topics dengan jumlah destinasi' })
  @ApiResponse({ status: 200, description: 'Topics berhasil diambil' })
  async findAll(@Query('scope') scope?: 'search' | 'detail') {
    return this.topicsService.findAll(scope);
  }

  @Get('groups')
  @Public()
  @ApiOperation({ summary: 'List semua topic group' })
  @ApiResponse({ status: 200, description: 'Topic groups berhasil diambil' })
  async findGroups() {
    return this.topicsService.findGroups();
  }

  // Menghapus topik sebagai admin.
  @Delete(':id')
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Hapus topik' })
  @ApiParam({ name: 'id', type: Number, description: 'Topic ID' })
  @ApiResponse({ status: 200, description: 'Topik berhasil dihapus' })
  @ApiResponse({ status: 404, description: 'Topic tidak ditemukan' })
  async deleteTopic(@Param('id', ParseIntPipe) id: number) {
    return this.topicsService.deleteTopic(id);
  }

  // Mengambil destinasi yang terkait dengan topik.
  @Get(':id/destinations')
  @Public()
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
    return this.topicsService.findDestinationsByTopic(
      id,
      parsedPage,
      parsedLimit,
    );
  }
}
