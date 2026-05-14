import { Module } from '@nestjs/common';
import { UserReviewsController } from './user-reviews.controller';
import { AdminReviewsController } from './admin-reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
    controllers: [UserReviewsController, AdminReviewsController],
    providers: [ReviewsService],
    exports: [ReviewsService],
})
export class ReviewsModule { }
