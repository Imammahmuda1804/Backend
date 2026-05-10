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
