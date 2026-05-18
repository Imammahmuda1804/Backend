import {
  Controller,
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
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { ReviewsQueryDto } from './dto/reviews-query.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin - Reviews')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin/reviews')
export class AdminReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('destination/:id')
  @ApiOperation({ summary: 'Mendapatkan daftar review untuk sebuah destinasi' })
  @ApiResponse({ status: 200, description: 'Daftar review berhasil diambil' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
  async getReviewsByDestination(
    @Param('id', ParseIntPipe) destinationId: number,
    @Query() query: ReviewsQueryDto,
  ) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    return this.reviewsService.getReviewsByDestination(
      destinationId,
      page,
      limit,
      query.sentiment,
      query.topic_id,
      query.date_from,
      query.date_to,
      query.sort_by,
      query.nlp_status,
    );
  }

  @Delete('destination/:id/bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Menghapus review secara masal (Bulk Delete)' })
  @ApiResponse({
    status: 200,
    description: 'Review berhasil dihapus secara masal',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
  async deleteBulkReviews(
    @Param('id', ParseIntPipe) destinationId: number,
    @Query('category') category: 'all' | 'processed' | 'unprocessed',
  ) {
    return this.reviewsService.deleteBulkReviews(destinationId, category);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Menghapus review (scraped review)' })
  @ApiResponse({ status: 200, description: 'Review berhasil dihapus' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
  @ApiResponse({ status: 404, description: 'Review tidak ditemukan' })
  async deleteReview(@Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.deleteReview(id);
  }
}
