import { ReviewsService } from './reviews.service';
import { CreateUserReviewDto } from './dto';
export declare class UserReviewsController {
    private readonly reviewsService;
    constructor(reviewsService: ReviewsService);
    createReview(dto: CreateUserReviewDto, userId: number): Promise<{
        id: number;
        destination_id: number;
        rating: number;
        review_text: string | null;
        created_at: Date;
    }>;
}
