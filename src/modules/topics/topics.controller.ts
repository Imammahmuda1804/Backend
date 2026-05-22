import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
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
  ApiBody,
} from '@nestjs/swagger';
import { TopicsService } from './topics.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  RenameTopicDto,
  RenameTopicGroupDto,
  UpdateTopicSettingsDto,
} from './dto/topic-admin.dto';

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

  // Menamai ulang topic fallback memakai AI.
  @Post('rename-ai')
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Rename topic fallback memakai AI' })
  @ApiResponse({ status: 201, description: 'Proses rename AI selesai' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - ADMIN only' })
  async renameWithAi() {
    return this.topicsService.renameUnnamedTopics();
  }

  // Mengganti nama topic luas.
  @Put('groups/:id/rename')
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Rename topic group' })
  @ApiParam({ name: 'id', type: Number, description: 'Topic group ID' })
  @ApiBody({ type: RenameTopicGroupDto })
  @ApiResponse({ status: 200, description: 'Topic group berhasil diganti' })
  @ApiResponse({ status: 404, description: 'Topic group tidak ditemukan' })
  async renameGroup(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RenameTopicGroupDto,
  ) {
    return this.topicsService.renameGroup(id, dto.groupName);
  }

  // Mengganti nama topic sempit.
  @Put(':id/rename')
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Rename topic' })
  @ApiParam({ name: 'id', type: Number, description: 'Topic ID' })
  @ApiBody({ type: RenameTopicDto })
  @ApiResponse({ status: 200, description: 'Topic berhasil diganti' })
  @ApiResponse({ status: 404, description: 'Topic tidak ditemukan' })
  async renameTopic(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RenameTopicDto,
  ) {
    return this.topicsService.renameTopic(id, dto.topicName);
  }

  // Mengubah group dan visibility topic.
  @Put(':id/settings')
  @ApiBearerAuth()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update setting topic' })
  @ApiParam({ name: 'id', type: Number, description: 'Topic ID' })
  @ApiBody({ type: UpdateTopicSettingsDto })
  @ApiResponse({ status: 200, description: 'Setting topic berhasil diubah' })
  @ApiResponse({ status: 404, description: 'Topic atau group tidak ditemukan' })
  async updateSettings(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTopicSettingsDto,
  ) {
    return this.topicsService.updateTopicSettings(id, dto);
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
