import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Request,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto';
import { Public } from '../../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

// Payload user yang tersedia dari JWT.
interface AuthUser {
  id: number;
  email: string;
  role: string;
}

interface SearchRequest {
  user?: AuthUser;
}

@ApiTags('Search')
@Controller('search')
// Membuka endpoint pencarian semantik dan riwayat pencarian user.
export class SearchController {
  private readonly logger = new Logger(SearchController.name);

  constructor(private readonly searchService: SearchService) {}
  // Mencari destinasi dan menyimpan history jika token valid.
  @Public()
  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Semantic search destinasi wisata',
    description:
      'Cari destinasi menggunakan natural language query. ' +
      'Bisa diakses tanpa login. Jika login, riwayat pencarian akan disimpan otomatis.',
  })
  @ApiResponse({ status: 200, description: 'Hasil pencarian berhasil' })
  @ApiResponse({
    status: 400,
    description: 'Query tidak valid (min 3 karakter)',
  })
  @ApiResponse({ status: 503, description: 'NLP service tidak tersedia' })
  async search(@Body() dto: SearchQueryDto, @Request() req?: SearchRequest) {
    const userId = req?.user?.id;
    this.logger.log(`🔍 Search endpoint called`);
    this.logger.log(`   Query: "${dto.query}"`);
    this.logger.log(`   req.user: ${JSON.stringify(req?.user)}`);
    this.logger.log(`   userId extracted: ${userId}`);

    return this.searchService.semanticSearch(dto, userId);
  }
  // Mengambil riwayat pencarian user login.
  @Get('history')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Riwayat pencarian user yang sedang login' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Riwayat pencarian berhasil diambil',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getHistory(
    @CurrentUser('id') userId: number,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
    return this.searchService.getHistory(
      userId,
      pageNum,
      limitNum,
    );
  }
  // Menghapus semua riwayat pencarian user.
  @Delete('history')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hapus semua riwayat pencarian user' })
  @ApiResponse({ status: 200, description: 'Semua riwayat berhasil dihapus' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async clearHistory(@CurrentUser('id') userId: number) {
    return this.searchService.clearHistory(userId);
  }
  // Menghapus satu riwayat setelah validasi kepemilikan.
  @Delete('history/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hapus satu entry riwayat pencarian' })
  @ApiResponse({ status: 200, description: 'Entry berhasil dihapus' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — bukan milik user ini' })
  @ApiResponse({ status: 404, description: 'Entry tidak ditemukan' })
  async deleteHistoryEntry(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.searchService.deleteHistoryEntry(id, userId);
  }
}
