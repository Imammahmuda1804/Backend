import { ReviewsService } from './reviews.service';
import { ReviewsQueryDto } from './dto/reviews-query.dto';
export declare class AdminReviewsController {
    private readonly reviewsService;
    constructor(reviewsService: ReviewsService);
    getReviewsByDestination(destinationId: number, query: ReviewsQueryDto): Promise<{
        data: ({
            topic: {
                id: number;
                topicName: string;
            } | null;
        } & {
            id: number;
            destinationId: number;
            reviewerName: string;
            reviewText: string | null;
            cleanedText: string | null;
            rating: number | null;
            reviewDate: Date | null;
            source: string | null;
            likesCount: number | null;
            ownerReply: string | null;
            sentiment: string | null;
            topicId: number | null;
            scrapingJobId: number | null;
            createdAt: Date;
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
    deleteReview(id: number): Promise<{
        message: string;
    }>;
}
