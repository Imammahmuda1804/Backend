import { PrismaService } from '../../prisma/prisma.service';
import { CreateDestinationDto, UpdateDestinationDto, UpdateMapsUrlDto } from './dto';
export declare class DestinationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateDestinationDto): Promise<{
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
    findAll(page: number, limit: number, search?: string, topicId?: number): Promise<{
        data: {
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
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            total_pages: number;
        };
    }>;
    findOneAdmin(id: number): Promise<{
        scrapingJobs: {
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
        }[];
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
    }>;
    update(id: number, dto: UpdateDestinationDto): Promise<{
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
    softDelete(id: number): Promise<{
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
    updateMapsUrl(id: number, dto: UpdateMapsUrlDto): Promise<{
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
    uploadThumbnail(destinationId: number, filename: string): Promise<{
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
    uploadImage(destinationId: number, filename: string): Promise<{
        id: number;
        createdAt: Date;
        destinationId: number;
        imageUrl: string;
    }>;
    deleteImage(imageId: number): Promise<{
        id: number;
        createdAt: Date;
        destinationId: number;
        imageUrl: string;
    }>;
    findRecommendations(page: number, limit: number): Promise<{
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
    findOnePublic(id: number): Promise<{
        averageUserRating: number | null;
        totalUserReviews: number;
        scrapedAverageRating: number | null;
        scrapedReviewCount: number;
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
    findOnePublicBySlug(slug: string): Promise<{
        averageUserRating: number | null;
        totalUserReviews: number;
        scrapedAverageRating: number | null;
        scrapedReviewCount: number;
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
    findRanking(sortBy: string, limit: number): Promise<{
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
}
