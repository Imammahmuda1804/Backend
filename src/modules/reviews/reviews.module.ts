import { Module } from '@nestjs/common';
import { UserReviewsController } from './user-reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
    controllers: [UserReviewsController],
    providers: [ReviewsService],
    exports: [ReviewsService],
})
export class ReviewsModule { }
