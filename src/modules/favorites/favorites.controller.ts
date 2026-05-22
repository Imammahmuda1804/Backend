import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Favorites')
@ApiBearerAuth()
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  // Menambahkan destinasi ke favorit.
  @Post(':destinationId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Simpan destinasi ke favorites' })
  @ApiParam({ name: 'destinationId', type: Number })
  @ApiResponse({ status: 201, description: 'Berhasil disimpan ke favorites' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Destinasi tidak ditemukan' })
  async addFavorite(
    @Param('destinationId', ParseIntPipe) destinationId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.favoritesService.addFavorite(userId, destinationId);
  }

  // Mengambil daftar favorit user.
  @Get()
  @ApiOperation({ summary: 'Daftar destinasi favorit user' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'List favorites berhasil diambil' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFavorites(
    @CurrentUser('id') userId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedPage = page ? parseInt(page, 10) : 1;
    const parsedLimit = limit ? Math.min(parseInt(limit, 10), 100) : 20;
    return this.favoritesService.getFavorites(userId, parsedPage, parsedLimit);
  }

  // Menghapus destinasi dari favorit.
  @Delete(':destinationId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hapus destinasi dari favorites' })
  @ApiParam({ name: 'destinationId', type: Number })
  @ApiResponse({ status: 200, description: 'Berhasil dihapus dari favorites' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeFavorite(
    @Param('destinationId', ParseIntPipe) destinationId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.favoritesService.removeFavorite(userId, destinationId);
  }

  // Mengecek status favorit user.
  @Get('check/:destinationId')
  @ApiOperation({ summary: 'Cek apakah destinasi ada di daftar favorit' })
  @ApiParam({ name: 'destinationId', type: Number })
  @ApiResponse({ status: 200, description: 'Status favorit berhasil dicek' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async checkFavorite(
    @Param('destinationId', ParseIntPipe) destinationId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.favoritesService.checkFavorite(userId, destinationId);
  }
}
