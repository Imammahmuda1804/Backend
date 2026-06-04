import { PrismaService } from '../../prisma/prisma.service';
type CompareTopicSignal = {
    topic_name: string;
    total_reviews: number;
    group_name?: string | null;
};
type CompareFactorKey = 'access' | 'cost_value' | 'cleanliness' | 'facilities' | 'crowd' | 'view_activity';
type CompareDestinationSnapshot = {
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
    topics: CompareTopicSignal[];
    top_topics: CompareTopicSignal[];
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
    decision_factors: Record<CompareFactorKey, number>;
    highlights: string[];
    risks: string[];
};
export declare class AnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getPublicDashboard(): Promise<{
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
    getAdminSummary(): Promise<{
        total_users: number;
        users_breakdown: Record<string, number>;
        total_destinations: number;
        destinations_breakdown: {
            active: number;
            deleted: number;
        };
        total_reviews: number;
        reviews_breakdown: {
            scraped: number;
            user_submitted: number;
        };
        total_scraping_jobs: number;
        scraping_jobs_breakdown: Record<string, number>;
        sentiment_distribution: {
            positive: number;
            negative: number;
            neutral: number;
        };
        top_destinations: {
            id: number;
            name: string;
            city: string;
            googleRating: number | null;
            positiveRatio: number | null;
            recommendationScore: number | null;
        }[];
        latest_scraping_jobs: ({
            destination: {
                name: string;
                city: string;
            };
        } & {
            id: number;
            status: string;
            createdAt: Date;
            destinationId: number;
            source: string;
            totalReviews: number | null;
            startedAt: Date | null;
            finishedAt: Date | null;
            errorMessage: string | null;
            createdBy: number | null;
        })[];
        top_topics: {
            topic_name: string;
            count: number;
        }[];
        data_freshness: {
            latest_completed_job: ({
                destination: {
                    name: string;
                    city: string;
                };
            } & {
                id: number;
                status: string;
                createdAt: Date;
                destinationId: number;
                source: string;
                totalReviews: number | null;
                startedAt: Date | null;
                finishedAt: Date | null;
                errorMessage: string | null;
                createdBy: number | null;
            }) | null;
            latest_failed_job: ({
                destination: {
                    name: string;
                    city: string;
                };
            } & {
                id: number;
                status: string;
                createdAt: Date;
                destinationId: number;
                source: string;
                totalReviews: number | null;
                startedAt: Date | null;
                finishedAt: Date | null;
                errorMessage: string | null;
                createdBy: number | null;
            }) | null;
            destinations_without_thumbnail: number;
            destinations_without_trends: number;
        };
        action_queue: {
            failed_jobs: number;
            pending_jobs: number;
            destinations_without_thumbnail: number;
            destinations_without_trends: number;
            recent_negative_reviews: {
                id: number;
                createdAt: Date;
                rating: number | null;
                reviewText: string | null;
                destination: {
                    id: number;
                    name: string;
                    city: string;
                };
            }[];
        };
        topic_risk_matrix: {
            topic_name: string;
            positive: number;
            neutral: number;
            negative: number;
            total: number;
            risk_ratio: number;
        }[];
        destination_quality_matrix: {
            id: number;
            name: string;
            city: string;
            google_rating: number | null;
            google_review_count: number | null;
            recommendation_score: number | null;
            positive_ratio: number | null;
        }[];
    }>;
    getAdminActivity(): Promise<{
        recent_scraping_jobs: ({
            destination: {
                name: string;
            };
        } & {
            id: number;
            status: string;
            createdAt: Date;
            destinationId: number;
            source: string;
            totalReviews: number | null;
            startedAt: Date | null;
            finishedAt: Date | null;
            errorMessage: string | null;
            createdBy: number | null;
        })[];
        recent_scraped_reviews: {
            id: number;
            createdAt: Date;
            rating: number | null;
            destination: {
                name: string;
            };
            reviewerName: string;
            sentiment: string | null;
        }[];
        recent_user_reviews: {
            id: number;
            createdAt: Date;
            user: {
                name: string;
            };
            rating: number;
            reviewText: string | null;
            destination: {
                name: string;
            };
        }[];
        recent_registrations: {
            id: number;
            email: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
            status: string;
            createdAt: Date;
        }[];
    }>;
    getAdminTrends(period?: 'daily' | 'weekly' | 'monthly'): Promise<{
        period: "daily" | "weekly" | "monthly";
        trends: {
            positive: number;
            negative: number;
            neutral: number;
            total: number;
            date: string;
        }[];
    }>;
    getDestinationAnalytics(destinationId: number): Promise<{
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
    getDestinationTopics(destinationId: number): Promise<{
        topics: {
            topic_name: string;
            total_reviews: number;
            percentage: number;
        }[];
    }>;
    getDestinationTrends(destinationId: number, period?: 'daily' | 'weekly' | 'monthly'): Promise<{
        trends: {
            positive: number;
            negative: number;
            neutral: number;
            date: string;
        }[];
    }>;
    compareDestinations(id1: number, id2: number): Promise<{
        destination1: CompareDestinationSnapshot;
        destination2: CompareDestinationSnapshot;
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
    exportAnalyticsCsv(destinationId: number): Promise<{
        csv: string;
        filename: string;
    }>;
    recalculateAnalytics(destinationId: number): Promise<{
        message: string;
        destination_id: number;
        positive_ratio: number;
        recommendation_score: number;
        total_reviews: number;
        topics_count: number;
    }>;
    private buildSentimentDist;
    private getPeriodKey;
    private getDestinationSnapshot;
    private buildTopicGroups;
    private buildTravelTraits;
    private buildDecisionFactors;
    private pickTopicSignals;
    private pickRecommendedDestination;
    private buildCompareInsights;
    private buildScoreCard;
    private topicText;
    private scoreKeywords;
    private keywordDelta;
    private clampScore;
    private cleanTopicName;
    private traitLabel;
}
export {};
