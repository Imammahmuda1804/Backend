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
            createdAt: Date;
            destinationId: number;
            rating: number | null;
            reviewText: string | null;
            source: string | null;
            reviewerName: string;
            cleanedText: string | null;
            reviewDate: Date | null;
            reviewHash: string | null;
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
    deleteReview(id: number): Promise<{
        message: string;
    }>;
}
