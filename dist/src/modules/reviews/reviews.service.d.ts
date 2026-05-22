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
    getReviewsByDestination(destinationId: number, page: number, limit: number, sentiment?: string, topicId?: number, dateFrom?: string, dateTo?: string, sortBy?: 'newest' | 'oldest', nlpStatus?: 'all' | 'processed' | 'unprocessed'): Promise<{
        data: ({
            topic: {
                id: number;
                topicName: string;
            } | null;
        } & {
            id: number;
            createdAt: Date;
            destinationId: number;
            rating: number | null;
            reviewText: string | null;
            source: string | null;
            reviewerName: string;
            cleanedText: string | null;
            reviewDate: Date | null;
            likesCount: number | null;
            ownerReply: string | null;
            sentiment: string | null;
            sentimentConfidence: number | null;
            topicId: number | null;
            scrapingJobId: number | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    deleteBulkReviews(destinationId: number, category: 'all' | 'processed' | 'unprocessed'): Promise<{
        message: string;
    }>;
}
