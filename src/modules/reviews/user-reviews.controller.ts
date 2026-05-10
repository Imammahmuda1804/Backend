import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateUserReviewDto } from './dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('User Reviews')
@ApiBearerAuth()
@Controller('user-reviews')
export class UserReviewsController {
    constructor(private readonly reviewsService: ReviewsService) { }

    /**
     * POST /api/user-reviews
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Buat review dan rating untuk destinasi',
        description:
            'User memberikan rating (1-5) dan review text (opsional) untuk destinasi. ' +
            'Rating destinasi akan direcalculate otomatis.',
    })
    @ApiResponse({ status: 201, description: 'Review berhasil dibuat' })
    @ApiResponse({ status: 400, description: 'Validasi gagal (rating 1-5)' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Destinasi tidak ditemukan' })
    async createReview(
        @Body() dto: CreateUserReviewDto,
        @CurrentUser('id') userId: number,
    ) {
        return this.reviewsService.createUserReview(userId, dto);
    }
}
