import { PrismaService } from '../../prisma/prisma.service';
import { CreateDestinationDto, UpdateDestinationDto, UpdateMapsUrlDto } from './dto';
import type { Prisma } from '@prisma/client';
export declare class DestinationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateDestinationDto): Promise<{
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
    findAll(page: number, limit: number, search?: string, topicId?: number, topicIds?: number[], city?: string): Promise<{
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
    getCities(): Promise<string[]>;
    findOneAdmin(id: number): Promise<{
        scrapingJobs: {
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
        }[];
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
                keywords: Prisma.JsonValue | null;
            };
        } & {
            id: number;
            destinationId: number;
            topicId: number;
            totalReviews: number;
        })[];
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
    }>;
    update(id: number, dto: UpdateDestinationDto): Promise<{
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
    softDelete(id: number): Promise<{
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
    updateMapsUrl(id: number, dto: UpdateMapsUrlDto): Promise<{
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
    uploadThumbnail(destinationId: number, filename: string): Promise<{
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
    uploadImage(destinationId: number, filename: string): Promise<{
        createdAt: Date;
        id: number;
        destinationId: number;
        imageUrl: string;
    }>;
    deleteImage(imageId: number): Promise<{
        createdAt: Date;
        id: number;
        destinationId: number;
        imageUrl: string;
    }>;
    findRecommendations(page: number, limit: number): Promise<{
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
    findOnePublic(id: number): Promise<{
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
                keywords: Prisma.JsonValue | null;
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
    findOnePublicBySlug(slug: string): Promise<{
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
                keywords: Prisma.JsonValue | null;
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
    findRanking(sortBy: string, limit: number): Promise<{
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
    getReviewsByTopic(destinationId: number, topicId: number, page: number, limit: number): Promise<{
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
    private buildTopicSentimentBreakdown;
}
