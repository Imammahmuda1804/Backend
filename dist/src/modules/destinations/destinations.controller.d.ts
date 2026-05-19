import { DestinationsService } from './destinations.service';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { DestinationQueryDto } from './dto/destination-query.dto';
export declare class DestinationsController {
    private readonly destinationsService;
    constructor(destinationsService: DestinationsService);
    getCities(): Promise<string[]>;
    findAll(query: DestinationQueryDto): Promise<{
        data: ({
            images: {
                id: number;
                createdAt: Date;
                destinationId: number;
                imageUrl: string;
            }[];
        } & {
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            slug: string;
            city: string;
            province: string;
            latitude: number | null;
            longitude: number | null;
            googleMapsUrl: string | null;
            googlePlaceId: string | null;
            googleRating: number | null;
            googleReviewCount: number | null;
            userRating: number | null;
            userReviewCount: number | null;
            youtubeUrl: string | null;
            thumbnailUrl: string | null;
            positiveRatio: number | null;
            recommendationScore: number | null;
            deletedAt: Date | null;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            total_pages: number;
        };
    }>;
    getRecommendations(query: PaginationQueryDto): Promise<{
        data: {
            id: number;
            name: string;
            slug: string;
            city: string;
            province: string;
            googleRating: number | null;
            userRating: number | null;
            thumbnailUrl: string | null;
            positiveRatio: number | null;
            recommendationScore: number | null;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            total_pages: number;
        };
    }>;
    getRanking(sortBy: string, limit: string): Promise<{
        id: number;
        name: string;
        slug: string;
        city: string;
        province: string;
        googleRating: number | null;
        userRating: number | null;
        thumbnailUrl: string | null;
        positiveRatio: number | null;
        recommendationScore: number | null;
    }[]>;
    getDetailBySlug(slug: string): Promise<{
        averageUserRating: number | null;
        totalUserReviews: number;
        scrapedAverageRating: number | null;
        scrapedReviewCount: number;
        topicSentimentBreakdown: Record<number, {
            positive: number;
            negative: number;
            neutral: number;
        }>;
        userReviews: ({
            user: {
                id: number;
                name: string;
                profilePicture: string | null;
            };
        } & {
            id: number;
            createdAt: Date;
            rating: number;
            destinationId: number;
            reviewText: string | null;
            userId: number;
        })[];
        images: {
            id: number;
            createdAt: Date;
            destinationId: number;
            imageUrl: string;
        }[];
        sentimentTrends: {
            id: number;
            destinationId: number;
            date: Date;
            positiveCount: number;
            negativeCount: number;
            neutralCount: number;
        }[];
        destinationTopics: ({
            topic: {
                id: number;
                createdAt: Date;
                topicName: string;
                keywords: import("@prisma/client/runtime/client").JsonValue | null;
            };
        } & {
            id: number;
            destinationId: number;
            topicId: number;
            totalReviews: number;
        })[];
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        slug: string;
        city: string;
        province: string;
        latitude: number | null;
        longitude: number | null;
        googleMapsUrl: string | null;
        googlePlaceId: string | null;
        googleRating: number | null;
        googleReviewCount: number | null;
        userRating: number | null;
        userReviewCount: number | null;
        youtubeUrl: string | null;
        thumbnailUrl: string | null;
        positiveRatio: number | null;
        recommendationScore: number | null;
        deletedAt: Date | null;
    }>;
    getReviewsByTopic(id: number, topicIdStr: string, pageStr: string, limitStr: string): Promise<{
        data: {
            id: number;
            rating: number | null;
            sentiment: string | null;
            reviewText: string | null;
            reviewerName: string;
            reviewDate: Date | null;
            likesCount: number | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getDetail(id: number): Promise<{
        averageUserRating: number | null;
        totalUserReviews: number;
        scrapedAverageRating: number | null;
        scrapedReviewCount: number;
        topicSentimentBreakdown: Record<number, {
            positive: number;
            negative: number;
            neutral: number;
        }>;
        userReviews: ({
            user: {
                id: number;
                name: string;
                profilePicture: string | null;
            };
        } & {
            id: number;
            createdAt: Date;
            rating: number;
            destinationId: number;
            reviewText: string | null;
            userId: number;
        })[];
        images: {
            id: number;
            createdAt: Date;
            destinationId: number;
            imageUrl: string;
        }[];
        sentimentTrends: {
            id: number;
            destinationId: number;
            date: Date;
            positiveCount: number;
            negativeCount: number;
            neutralCount: number;
        }[];
        destinationTopics: ({
            topic: {
                id: number;
                createdAt: Date;
                topicName: string;
                keywords: import("@prisma/client/runtime/client").JsonValue | null;
            };
        } & {
            id: number;
            destinationId: number;
            topicId: number;
            totalReviews: number;
        })[];
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        slug: string;
        city: string;
        province: string;
        latitude: number | null;
        longitude: number | null;
        googleMapsUrl: string | null;
        googlePlaceId: string | null;
        googleRating: number | null;
        googleReviewCount: number | null;
        userRating: number | null;
        userReviewCount: number | null;
        youtubeUrl: string | null;
        thumbnailUrl: string | null;
        positiveRatio: number | null;
        recommendationScore: number | null;
        deletedAt: Date | null;
    }>;
}
