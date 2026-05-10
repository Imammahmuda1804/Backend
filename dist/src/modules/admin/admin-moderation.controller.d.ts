import { ReviewsService } from '../reviews/reviews.service';
import { AnalyticsService } from '../analytics/analytics.service';
export declare class AdminModerationController {
    private readonly reviewsService;
    private readonly analyticsService;
    constructor(reviewsService: ReviewsService, analyticsService: AnalyticsService);
    deleteReview(id: number): Promise<{
        message: string;
    }>;
    deleteUserReview(id: number): Promise<{
        message: string;
    }>;
    recalculateAnalytics(destinationId: number): Promise<{
        message: string;
        destination_id: number;
        positive_ratio: number;
        recommendation_score: number;
        total_reviews: number;
        topics_count: number;
    }>;
}
