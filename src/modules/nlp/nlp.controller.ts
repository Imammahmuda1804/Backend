import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NlpUploadService } from './nlp-upload.service';

const NLP_UPLOAD_FILE_OPTIONS = {
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (
    _req: unknown,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/octet-stream',
    ];
    const allowedExts = ['.xlsx', '.xls', '.csv'];
    const ext = file.originalname
      .toLowerCase()
      .substring(file.originalname.lastIndexOf('.'));

    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
      return;
    }

    cb(
      new BadRequestException(
        'Hanya file Excel (.xlsx) atau CSV (.csv) yang diperbolehkan',
      ),
      false,
    );
  },
};

@ApiTags('Admin - NLP Processing')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/nlp')
// Controller hanya menerima request admin; alur proses dipindahkan ke NlpUploadService.
export class NlpController {
  constructor(private readonly nlpUploadService: NlpUploadService) {}

  @Post('preflight')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file', NLP_UPLOAD_FILE_OPTIONS))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Cek file NLP sebelum diproses',
    description:
      'Membaca file review, menghitung hash file/review, dan mengembalikan jumlah review baru serta duplikat.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        destination_id: { type: 'integer' },
      },
    },
  })
  preflight(
    @UploadedFile() file: Express.Multer.File,
    @Body('destination_id') destinationIdStr: string,
  ) {
    return this.nlpUploadService.preflight(file, destinationIdStr);
  }

  @Get('history')
  @ApiOperation({ summary: 'List riwayat proses NLP admin' })
  @ApiQuery({ name: 'destination_id', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getHistory(
    @Query('destination_id') destinationId?: string,
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.nlpUploadService.getHistory(destinationId, status, page, limit);
  }

  @Get('history/:id')
  @ApiOperation({ summary: 'Detail riwayat proses NLP admin' })
  getHistoryDetail(@Param('id') id: string) {
    return this.nlpUploadService.getHistoryDetail(id);
  }

  @Post('upload')
  @HttpCode(202)
  @UseInterceptors(FileInterceptor('file', NLP_UPLOAD_FILE_OPTIONS))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload file Excel/CSV dan proses NLP',
    description:
      'Upload file hasil scraping dengan dedup review. Mode default skip_existing agar file yang sama tidak membuat review duplikat.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        destination_id: { type: 'integer' },
        mode: {
          type: 'string',
          enum: ['skip_existing', 'reprocess_existing', 'replace_existing'],
        },
      },
    },
  })
  @ApiResponse({ status: 202, description: 'NLP processing berhasil dimulai' })
  @ApiResponse({
    status: 400,
    description: 'File tidak valid atau destinasi tidak ditemukan',
  })
  uploadAndProcess(
    @UploadedFile() file: Express.Multer.File,
    @Body('destination_id') destinationIdStr: string,
    @Body('mode') rawMode: string | undefined,
    @CurrentUser('id') adminId?: number,
  ) {
    return this.nlpUploadService.uploadAndProcess({
      file,
      destinationIdStr,
      rawMode,
      adminId,
    });
  }
}
