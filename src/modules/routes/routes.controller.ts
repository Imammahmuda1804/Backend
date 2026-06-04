import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RoutesService } from './routes.service';
import {
  AutoSortRouteDto,
  CreateRouteDto,
  UpdateRouteProgressDto,
  UpdateRouteDto,
} from './dto/route.dto';

@ApiTags('Routes')
@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get('public')
  @Public()
  @ApiOperation({ summary: 'List route publik' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'city', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Route publik berhasil diambil' })
  findPublic(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('city') city?: string,
  ) {
    return this.routesService.findPublic(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 12,
      city,
    );
  }

  @Get('share/:shareSlug')
  @Public()
  @ApiOperation({ summary: 'Detail route shareable berdasarkan share slug' })
  @ApiParam({ name: 'shareSlug', type: String })
  @ApiResponse({ status: 200, description: 'Route berhasil diambil' })
  @ApiResponse({ status: 404, description: 'Route tidak ditemukan' })
  findByShareSlug(@Param('shareSlug') shareSlug: string) {
    return this.routesService.findByShareSlug(shareSlug);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List route buatan user login' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findMine(
    @CurrentUser('id') userId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.routesService.findMine(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('saved')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List route yang disimpan user login' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findSaved(
    @CurrentUser('id') userId: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.routesService.findSaved(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('saved/:routeId/progress')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ambil progress kunjungan route tersimpan' })
  @ApiParam({ name: 'routeId', type: Number })
  @ApiResponse({ status: 200, description: 'Progress route berhasil diambil' })
  findSavedProgress(
    @CurrentUser('id') userId: number,
    @Param('routeId', ParseIntPipe) routeId: number,
  ) {
    return this.routesService.findSavedProgress(userId, routeId);
  }

  @Put('saved/:routeId/progress/:routeStopId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update progress stop route tersimpan' })
  @ApiParam({ name: 'routeId', type: Number })
  @ApiParam({ name: 'routeStopId', type: Number })
  @ApiBody({ type: UpdateRouteProgressDto })
  updateSavedProgress(
    @CurrentUser('id') userId: number,
    @Param('routeId', ParseIntPipe) routeId: number,
    @Param('routeStopId', ParseIntPipe) routeStopId: number,
    @Body() dto: UpdateRouteProgressDto,
  ) {
    return this.routesService.updateSavedProgress(
      userId,
      routeId,
      routeStopId,
      dto,
    );
  }

  @Delete('saved/:routeId/progress/:routeStopId')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset progress stop route tersimpan' })
  @ApiParam({ name: 'routeId', type: Number })
  @ApiParam({ name: 'routeStopId', type: Number })
  resetSavedProgress(
    @CurrentUser('id') userId: number,
    @Param('routeId', ParseIntPipe) routeId: number,
    @Param('routeStopId', ParseIntPipe) routeStopId: number,
  ) {
    return this.routesService.resetSavedProgress(userId, routeId, routeStopId);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buat custom route user' })
  @ApiBody({ type: CreateRouteDto })
  @ApiResponse({ status: 201, description: 'Route berhasil dibuat' })
  create(@CurrentUser('id') userId: number, @Body() dto: CreateRouteDto) {
    return this.routesService.create(userId, dto, false);
  }

  @Post('auto-sort')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Auto sort destinasi route berdasarkan jarak' })
  @ApiBody({ type: AutoSortRouteDto })
  autoSort(@Body() dto: AutoSortRouteDto) {
    return this.routesService.autoSort(dto);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detail route berdasarkan ID' })
  @ApiParam({ name: 'id', type: Number })
  findById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.routesService.findById(id, userId);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update route milik user login' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateRouteDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateRouteDto,
  ) {
    return this.routesService.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hapus route milik user login' })
  @ApiParam({ name: 'id', type: Number })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.routesService.remove(id, userId);
  }

  @Post(':id/save')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Simpan route public/link-only' })
  @ApiParam({ name: 'id', type: Number })
  save(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.routesService.save(userId, id);
  }

  @Delete(':id/save')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hapus route dari simpanan user' })
  @ApiParam({ name: 'id', type: Number })
  unsave(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.routesService.unsave(userId, id);
  }

  @Post(':id/duplicate')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Duplikasi route menjadi route private milik user' })
  @ApiParam({ name: 'id', type: Number })
  duplicate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.routesService.duplicate(userId, id);
  }
}
