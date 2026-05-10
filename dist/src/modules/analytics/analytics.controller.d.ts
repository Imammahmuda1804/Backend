import { AnalyticsService } from './analytics.service';
import { CompareQueryDto, TrendsQueryDto } from './dto';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getDashboard(): Promise<{
        total_destinations: number;
        total_reviews: number;
        sentiment_distribution: Record<string, number>;
        top_topics: {
            topic_name: string;
            count: number;
        }[];
        top_recommendations: {
            id: number;
            name: string;
            slug: string;
            city: string;
            thumbnailUrl: string | null;
            positiveRatio: number | null;
            recommendationScore: number | null;
        }[];
    }>;
    getDestinationAnalytics(id: number): Promise<{
        destination_id: number;
        destination_name: string;
        total_reviews: number;
        sentiment_distribution: Record<string, number>;
        average_rating: number | null;
        positive_ratio: number | null;
        recommendation_score: number | null;
    }>;
    getDestinationTopics(id: number): Promise<{
        topics: {
            topic_name: string;
            total_reviews: number;
            percentage: number;
        }[];
    }>;
    getDestinationTrends(id: number, query: TrendsQueryDto): Promise<{
        trends: {
            positive: number;
            negative: number;
            neutral: number;
            date: string;
        }[];
    }>;
    compareDestinations(query: CompareQueryDto): Promise<{
        destination1: {
            id: number;
            name: string;
            sentiment: Record<string, number>;
            topics: {
                topic_name: string;
                total_reviews: number;
            }[];
            rating: {
                google: number | null;
                user: number | null;
            };
            recommendation_score: number | null;
            positive_ratio: number | null;
        };
        destination2: {
            id: number;
            name: string;
            sentiment: Record<string, number>;
            topics: {
                topic_name: string;
                total_reviews: number;
            }[];
            rating: {
                google: number | null;
                user: number | null;
            };
            recommendation_score: number | null;
            positive_ratio: number | null;
        };
        comparison: {
            sentiment_winner: number;
            rating_winner: number;
            recommendation_winner: number;
            score_difference: number;
        };
    }>;
}
