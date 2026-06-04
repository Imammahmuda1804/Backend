import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CreateRouteDto,
  PublishRouteDto,
  UpdateRouteDto,
} from './dto/route.dto';
import { RoutesService } from './routes.service';

@ApiTags('Admin - Routes')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/routes')
export class AdminRoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get()
  @ApiOperation({ summary: 'List semua route untuk admin' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Route berhasil diambil' })
  findAdmin(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.routesService.findAdmin(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Buat curated route admin' })
  @ApiBody({ type: CreateRouteDto })
  @ApiResponse({ status: 201, description: 'Curated route berhasil dibuat' })
  createAdmin(@CurrentUser('id') userId: number, @Body() dto: CreateRouteDto) {
    return this.routesService.create(userId, dto, true);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update curated route admin' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateRouteDto })
  updateAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRouteDto,
  ) {
    return this.routesService.updateAdmin(id, dto);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: 'Ubah visibility route sebagai admin' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: PublishRouteDto })
  publishAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PublishRouteDto,
  ) {
    return this.routesService.publishAdmin(id, dto.visibility);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hapus route sebagai admin' })
  @ApiParam({ name: 'id', type: Number })
  removeAdmin(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.routesService.remove(id, userId, true);
  }
}
