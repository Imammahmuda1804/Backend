import { PrismaService } from '../../prisma/prisma.service';
export declare class AnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getPublicDashboard(): Promise<{
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
        sentiment_distribution: Record<string, number>;
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
            destination: {
                name: string;
            };
            rating: number | null;
            reviewerName: string;
            sentiment: string | null;
        }[];
        recent_user_reviews: {
            id: number;
            createdAt: Date;
            user: {
                name: string;
            };
            destination: {
                name: string;
            };
            rating: number;
            reviewText: string | null;
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
        sentiment_distribution: Record<string, number>;
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
}
