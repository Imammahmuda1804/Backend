import type { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { TrendsQueryDto } from './dto';
export declare class AdminAnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
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
            name: string;
            id: number;
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
            status: string;
            createdAt: Date;
            id: number;
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
                status: string;
                createdAt: Date;
                id: number;
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
                status: string;
                createdAt: Date;
                id: number;
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
                destination: {
                    name: string;
                    id: number;
                    city: string;
                };
                createdAt: Date;
                id: number;
                rating: number | null;
                reviewText: string | null;
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
            status: string;
            createdAt: Date;
            id: number;
            destinationId: number;
            source: string;
            totalReviews: number | null;
            startedAt: Date | null;
            finishedAt: Date | null;
            errorMessage: string | null;
            createdBy: number | null;
        })[];
        recent_scraped_reviews: {
            destination: {
                name: string;
            };
            createdAt: Date;
            id: number;
            rating: number | null;
            sentiment: string | null;
            reviewerName: string;
        }[];
        recent_user_reviews: {
            user: {
                name: string;
            };
            destination: {
                name: string;
            };
            createdAt: Date;
            id: number;
            rating: number;
            reviewText: string | null;
        }[];
        recent_registrations: {
            status: string;
            name: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
            createdAt: Date;
            id: number;
        }[];
    }>;
    getAdminTrends(query: TrendsQueryDto): Promise<{
        period: "daily" | "weekly" | "monthly";
        trends: {
            positive: number;
            negative: number;
            neutral: number;
            total: number;
            date: string;
        }[];
    }>;
    exportCsv(destinationId: number, res: Response): Promise<void>;
}
