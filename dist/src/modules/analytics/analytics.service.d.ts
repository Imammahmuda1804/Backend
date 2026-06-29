import { AnalyticsExportService } from './analytics-export.service';
import { AnalyticsRecalculationService } from './analytics-recalculation.service';
import { AnalyticsPeriod } from './analytics.types';
import { DashboardAnalyticsService } from './dashboard-analytics.service';
import { DestinationAnalyticsService } from './destination-analytics.service';
import { DestinationComparisonService } from './destination-comparison.service';
import { PublicDashboardAnalyticsService } from './public-dashboard-analytics.service';
export declare class AnalyticsService {
    private readonly dashboardAnalytics;
    private readonly publicDashboard;
    private readonly destinationAnalytics;
    private readonly destinationComparison;
    private readonly analyticsExport;
    private readonly analyticsRecalculation;
    constructor(dashboardAnalytics: DashboardAnalyticsService, publicDashboard: PublicDashboardAnalyticsService, destinationAnalytics: DestinationAnalyticsService, destinationComparison: DestinationComparisonService, analyticsExport: AnalyticsExportService, analyticsRecalculation: AnalyticsRecalculationService);
    getPublicDashboard(): Promise<{
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
            slug: string;
            city: string;
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
        sentiment_distribution: import("./analytics.types").SentimentDistribution;
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
            createdAt: Date;
            destinationId: number;
            source: string;
            totalReviews: number | null;
            status: string;
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
                createdAt: Date;
                destinationId: number;
                source: string;
                totalReviews: number | null;
                status: string;
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
                createdAt: Date;
                destinationId: number;
                source: string;
                totalReviews: number | null;
                status: string;
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
                destination: {
                    id: number;
                    name: string;
                    city: string;
                };
                id: number;
                createdAt: Date;
                reviewText: string | null;
                rating: number | null;
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
            city: string | null;
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
            createdAt: Date;
            destinationId: number;
            source: string;
            totalReviews: number | null;
            status: string;
            startedAt: Date | null;
            finishedAt: Date | null;
            errorMessage: string | null;
            createdBy: number | null;
        })[];
        recent_scraped_reviews: {
            destination: {
                name: string;
            };
            id: number;
            createdAt: Date;
            reviewerName: string;
            rating: number | null;
            sentiment: string | null;
        }[];
        recent_user_reviews: {
            destination: {
                name: string;
            };
            id: number;
            createdAt: Date;
            reviewText: string | null;
            rating: number;
            user: {
                name: string;
            };
        }[];
        recent_registrations: {
            id: number;
            name: string;
            createdAt: Date;
            email: string;
            role: import("@prisma/client").$Enums.Role;
            status: string;
        }[];
    }>;
    getAdminTrends(period?: AnalyticsPeriod): Promise<{
        period: AnalyticsPeriod;
        trends: ({
            date: string;
        } & {
            positive: number;
            negative: number;
            neutral: number;
            total: number;
        })[];
    }>;
    getDestinationAnalytics(destinationId: number): Promise<{
        destination_id: number;
        destination_name: string;
        total_reviews: number;
        sentiment_distribution: import("./analytics.types").SentimentDistribution;
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
    getDestinationTrends(destinationId: number, period?: AnalyticsPeriod): Promise<{
        trends: ({
            date: string;
        } & {
            positive: number;
            negative: number;
            neutral: number;
        })[];
    }>;
    compareDestinations(destination1Id: number, destination2Id: number): Promise<{
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
}
