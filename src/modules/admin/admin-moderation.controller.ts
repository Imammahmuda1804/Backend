import {
    Controller,
    Delete,
    Post,
    Param,
    ParseIntPipe,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { ReviewsService } from '../reviews/reviews.service';
import { AnalyticsService } from '../analytics/analytics.service';

@ApiTags('Admin - Moderation')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('admin')
export class AdminModerationController {
    constructor(
        private readonly reviewsService: ReviewsService,
        private readonly analyticsService: AnalyticsService,
    ) { }

    /**
     * DELETE /api/admin/reviews/:id
     * Hapus scraped review yang tidak pantas.
     */
    @Delete('reviews/:id')
    @ApiOperation({ summary: 'Hapus scraped review (moderasi)' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, description: 'Review berhasil dihapus' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
    @ApiResponse({ status: 404, description: 'Review tidak ditemukan' })
    async deleteReview(@Param('id', ParseIntPipe) id: number) {
        return this.reviewsService.deleteReview(id);
    }

    /**
     * DELETE /api/admin/user-reviews/:id
     * Hapus user review yang tidak pantas.
     */
    @Delete('user-reviews/:id')
    @ApiOperation({ summary: 'Hapus user review (moderasi)' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, description: 'User review berhasil dihapus' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
    @ApiResponse({ status: 404, description: 'User review tidak ditemukan' })
    async deleteUserReview(@Param('id', ParseIntPipe) id: number) {
        return this.reviewsService.deleteUserReview(id);
    }

    /**
     * POST /api/admin/analytics/recalculate/:destinationId
     * Recalculate semua analytics untuk satu destinasi.
     */
    @Post('analytics/recalculate/:destinationId')
    @ApiOperation({
        summary: 'Recalculate semua analytics untuk destinasi',
        description:
            'Menghitung ulang: positive_ratio, recommendation_score, ' +
            'destination_topics, sentiment_trends, user_rating.',
    })
    @ApiParam({ name: 'destinationId', type: Number })
    @ApiResponse({ status: 200, description: 'Analytics berhasil direcalculate' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden — ADMIN only' })
    @ApiResponse({ status: 404, description: 'Destinasi tidak ditemukan' })
    async recalculateAnalytics(
        @Param('destinationId', ParseIntPipe) destinationId: number,
    ) {
        return this.analyticsService.recalculateAnalytics(destinationId);
    }
}
