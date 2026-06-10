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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiResponse,
  OmitType,
} from '@nestjs/swagger';
import { DestinationsService } from './destinations.service';
import { ScraperService } from '../scraper/scraper.service';
import { StartScrapingDto } from '../scraper/dto';
import { multerImageOptions } from '../../config/multer.config';
import type { MulterFile } from '../../config/multer.config';
import {
  CreateDestinationDto,
  UpdateDestinationDto,
  DestinationQueryDto,
  UpdateMapsUrlDto,
} from './dto';
import { Roles } from '../../common/decorators/roles.decorator';

interface RequestWithUser extends Request {
  user?: {
    id: number;
    [key: string]: any;
  };
}

export class ScrapeDestinationDto extends OmitType(StartScrapingDto, [
  'destination_id',
] as const) {}

@ApiTags('Admin - Destinations')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/destinations')
export class AdminDestinationsController {
  constructor(
    private readonly destinationsService: DestinationsService,
    private readonly scraperService: ScraperService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Membuat destinasi baru' })
  @ApiResponse({ status: 201, description: 'Destination created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
  async create(@Body() dto: CreateDestinationDto) {
    return this.destinationsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Mendapatkan daftar destinasi (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated list of destinations' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
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

  @Get(':id')
  @ApiOperation({
    summary: 'Mendapatkan detail destinasi (dengan relasi analitik)',
  })
  @ApiResponse({
    status: 200,
    description: 'Destination detail with analytics',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
  @ApiResponse({ status: 404, description: 'Destination not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.destinationsService.findOneAdmin(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mengedit data destinasi' })
  @ApiResponse({ status: 200, description: 'Destination updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
  @ApiResponse({ status: 404, description: 'Destination not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDestinationDto,
  ) {
    return this.destinationsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete destinasi' })
  @ApiResponse({
    status: 200,
    description: 'Destination soft deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
  @ApiResponse({ status: 404, description: 'Destination not found' })
  async softDelete(@Param('id', ParseIntPipe) id: number) {
    return this.destinationsService.softDelete(id);
  }

  @Put(':id/maps-url')
  @ApiOperation({ summary: 'Update Google Maps URL destinasi' })
  @ApiResponse({ status: 200, description: 'Maps URL updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
  @ApiResponse({ status: 404, description: 'Destination not found' })
  async updateMapsUrl(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMapsUrlDto,
  ) {
    return this.destinationsService.updateMapsUrl(id, dto);
  }

  @Post(':id/thumbnail')
  @ApiOperation({ summary: 'Upload destination thumbnail (cover image)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Thumbnail uploaded successfully' })
  @ApiResponse({
    status: 400,
    description: 'File is required or invalid format',
  })
  @ApiResponse({ status: 404, description: 'Destination not found' })
  @UseInterceptors(FileInterceptor('file', multerImageOptions))
  async uploadThumbnail(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: MulterFile,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.destinationsService.uploadThumbnail(id, file);
  }

  @Post(':id/images')
  @ApiOperation({ summary: 'Upload destination gallery image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Image uploaded successfully' })
  @ApiResponse({
    status: 400,
    description: 'File is required or invalid format',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
  @ApiResponse({ status: 404, description: 'Destination not found' })
  @UseInterceptors(FileInterceptor('file', multerImageOptions))
  async uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: MulterFile,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.destinationsService.uploadImage(id, file);
  }

  @Delete('images/:imageId')
  @ApiOperation({ summary: 'Delete destination gallery image' })
  @ApiResponse({ status: 200, description: 'Image deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
  @ApiResponse({ status: 404, description: 'Image not found' })
  async deleteImage(@Param('imageId', ParseIntPipe) imageId: number) {
    return this.destinationsService.deleteImage(imageId);
  }

  @Post(':id/scrape')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Trigger scraping reviews langsung dari halaman destination',
  })
  @ApiResponse({ status: 202, description: 'Scraping job started' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
  @ApiResponse({ status: 404, description: 'Destination not found' })
  async scrapeDestination(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ScrapeDestinationDto,
    @Req() req: RequestWithUser,
  ) {
    const adminId = req.user?.id;

    const scrapeDto = new StartScrapingDto();
    Object.assign(scrapeDto, dto);
    scrapeDto.destination_id = id;

    return this.scraperService.startScraping(scrapeDto, adminId);
  }
}
