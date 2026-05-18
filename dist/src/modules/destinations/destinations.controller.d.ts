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
                createdAt: Date;
                id: number;
                destinationId: number;
                imageUrl: string;
            }[];
        } & {
            description: string | null;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            id: number;
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
            name: string;
            id: number;
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
        name: string;
        id: number;
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
                name: string;
                profilePicture: string | null;
                id: number;
            };
        } & {
            createdAt: Date;
            id: number;
            userId: number;
            destinationId: number;
            rating: number;
            reviewText: string | null;
        })[];
        images: {
            createdAt: Date;
            id: number;
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
                createdAt: Date;
                id: number;
                topicName: string;
                keywords: import("@prisma/client/runtime/client").JsonValue | null;
            };
        } & {
            id: number;
            destinationId: number;
            topicId: number;
            totalReviews: number;
        })[];
        description: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        id: number;
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
            reviewText: string | null;
            sentiment: string | null;
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
                name: string;
                profilePicture: string | null;
                id: number;
            };
        } & {
            createdAt: Date;
            id: number;
            userId: number;
            destinationId: number;
            rating: number;
            reviewText: string | null;
        })[];
        images: {
            createdAt: Date;
            id: number;
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
                createdAt: Date;
                id: number;
                topicName: string;
                keywords: import("@prisma/client/runtime/client").JsonValue | null;
            };
        } & {
            id: number;
            destinationId: number;
            topicId: number;
            totalReviews: number;
        })[];
        description: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        id: number;
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
