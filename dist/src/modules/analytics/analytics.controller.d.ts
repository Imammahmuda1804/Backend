import { AnalyticsService } from './analytics.service';
import { CompareQueryDto, TrendsQueryDto } from './dto';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getDashboard(): Promise<{
        total_destinations: number;
        total_reviews: number;
        sentiment_distribution: import("./analytics.types").SentimentDistribution;
        top_topics: {
            topic_name: string;
            count: number;
        }[];
        top_recommendations: {
            id: number;
            name: string;
            city: string;
            slug: string;
            thumbnailUrl: string | null;
            positiveRatio: number | null;
            recommendationScore: number | null;
        }[];
    }>;
    getDestinationAnalytics(id: number): Promise<{
        destination_id: number;
        destination_name: string;
        total_reviews: number;
        sentiment_distribution: import("./analytics.types").SentimentDistribution;
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
        trends: ({
            date: string;
        } & {
            positive: number;
            negative: number;
            neutral: number;
        })[];
    }>;
    compareDestinations(query: CompareQueryDto): Promise<{
        destination1: import("./analytics.types").CompareDestinationSnapshot;
        destination2: import("./analytics.types").CompareDestinationSnapshot;
        comparison: {
            sentiment_winner: number;
            rating_winner: number;
            recommendation_winner: number;
            score_difference: number;
            insights: {
                recommended_destination_id: number;
                summary: string;
                best_for: string[];
                tradeoffs: string[];
                score_cards: {
                    destination_id: number;
                    label: string;
                    score: number;
                    reasons: string[];
                }[];
            };
        };
    }>;
}
