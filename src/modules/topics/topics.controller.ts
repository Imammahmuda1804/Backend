import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
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

  /**
   * POST /api/topics/rename-ai
   * Trigger AI rename untuk semua topik yang masih menggunakan nama keyword-based.
   */
  @Post('rename-ai')
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Rename semua topik menggunakan AI (Gemini)' })
  @ApiResponse({ status: 200, description: 'Hasil rename topik' })
  async renameTopics() {
    return this.topicsService.renameUnnamedTopics();
  }

  /**
   * GET /api/topics
   */
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

  /**
   * PUT /api/topics/:id/rename
   * Rename topik tertentu secara manual.
   */
  @Put(':id/rename')
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Rename topik secara manual' })
  @ApiParam({ name: 'id', type: Number, description: 'Topic ID' })
  @ApiResponse({ status: 200, description: 'Topik berhasil di-rename' })
  @ApiResponse({ status: 404, description: 'Topic tidak ditemukan' })
  async renameTopic(
    @Param('id', ParseIntPipe) id: number,
    @Body('topicName') topicName: string,
  ) {
    return this.topicsService.renameTopic(id, topicName);
  }

  @Put(':id/settings')
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update group dan visibilitas topic' })
  @ApiParam({ name: 'id', type: Number, description: 'Topic ID' })
  async updateTopicSettings(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      groupId?: number | null;
      isSearchVisible?: boolean;
      isDetailVisible?: boolean;
    },
  ) {
    return this.topicsService.updateTopicSettings(id, body);
  }

  @Put('groups/:id/rename')
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Rename topic group' })
  @ApiParam({ name: 'id', type: Number, description: 'Topic group ID' })
  async renameGroup(
    @Param('id', ParseIntPipe) id: number,
    @Body('groupName') groupName: string,
  ) {
    return this.topicsService.renameGroup(id, groupName);
  }

  /**
   * DELETE /api/topics/:id
   * Hapus topik beserta relasinya.
   */
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

  /**
   * GET /api/topics/:id/destinations
   */
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
