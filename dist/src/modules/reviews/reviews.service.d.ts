import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserReviewDto } from './dto';
export declare class ReviewsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createUserReview(userId: number, dto: CreateUserReviewDto): Promise<{
        id: number;
        destination_id: number;
        rating: number;
        review_text: string | null;
        created_at: Date;
    }>;
    deleteReview(reviewId: number): Promise<{
        message: string;
    }>;
    deleteUserReview(userReviewId: number): Promise<{
        message: string;
    }>;
    recalculateUserRating(destinationId: number): Promise<void>;
}
