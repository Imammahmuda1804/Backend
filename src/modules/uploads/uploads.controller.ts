import {
  Controller,
  Post,
  Param,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UploadsService } from './uploads.service';
import { multerCsvOptions } from '../../config/multer.config';
import type { Request } from 'express';

interface RequestWithUser extends Request {
  user?: {
    id: number;
    [key: string]: any;
  };
}

@ApiTags('Admin - Uploads')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/destinations')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post(':id/upload-reviews')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Upload file review (CSV/XLSX) untuk destinasi tertentu',
    description:
      'Upload CSV atau Excel file berisi review data. File maksimal 10MB. Format yang didukung: .csv, .xlsx, .xls',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File CSV atau Excel berisi review data',
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV atau Excel file (max 10MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 202,
    description: 'File uploaded and processing started',
  })
  @ApiResponse({
    status: 400,
    description: 'File is required or invalid format',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
  @ApiResponse({ status: 404, description: 'Destination not found' })
  @UseInterceptors(FileInterceptor('file', multerCsvOptions))
  async uploadReviews(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithUser,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.uploadsService.processUpload(id, file, req.user?.id);
  }
}
