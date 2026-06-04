import { AnalyticsService } from './analytics.service';
import { CompareQueryDto, TrendsQueryDto } from './dto';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getDashboard(): Promise<{
        total_destinations: number;
        total_reviews: number;
        sentiment_distribution: {
            positive: number;
            negative: number;
            neutral: number;
        };
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
        sentiment_distribution: {
            positive: number;
            negative: number;
            neutral: number;
        };
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
            slug: string;
            city: string;
            province: string;
            category: string;
            thumbnailUrl: string | null;
            latitude: number | null;
            longitude: number | null;
            googleMapsUrl: string | null;
            sentiment: {
                positive: number;
                neutral: number;
                negative: number;
            };
            topics: {
                topic_name: string;
                total_reviews: number;
                group_name?: string | null;
            }[];
            top_topics: {
                topic_name: string;
                total_reviews: number;
                group_name?: string | null;
            }[];
            topic_groups: Array<{
                group_name: string;
                total_reviews: number;
            }>;
            rating: {
                google: number | null;
                user: number | null;
            };
            recommendation_score: number | null;
            positive_ratio: number | null;
            review_count: number;
            travel_traits: Record<string, number>;
            decision_factors: Record<"access" | "cost_value" | "cleanliness" | "facilities" | "crowd" | "view_activity", number>;
            highlights: string[];
            risks: string[];
        };
        destination2: {
            id: number;
            name: string;
            slug: string;
            city: string;
            province: string;
            category: string;
            thumbnailUrl: string | null;
            latitude: number | null;
            longitude: number | null;
            googleMapsUrl: string | null;
            sentiment: {
                positive: number;
                neutral: number;
                negative: number;
            };
            topics: {
                topic_name: string;
                total_reviews: number;
                group_name?: string | null;
            }[];
            top_topics: {
                topic_name: string;
                total_reviews: number;
                group_name?: string | null;
            }[];
            topic_groups: Array<{
                group_name: string;
                total_reviews: number;
            }>;
            rating: {
                google: number | null;
                user: number | null;
            };
            recommendation_score: number | null;
            positive_ratio: number | null;
            review_count: number;
            travel_traits: Record<string, number>;
            decision_factors: Record<"access" | "cost_value" | "cleanliness" | "facilities" | "crowd" | "view_activity", number>;
            highlights: string[];
            risks: string[];
        };
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
