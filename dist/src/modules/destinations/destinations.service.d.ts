import { PrismaService } from '../../prisma/prisma.service';
import { CreateDestinationDto, UpdateDestinationDto, UpdateMapsUrlDto } from './dto';
import type { Prisma } from '@prisma/client';
export declare class DestinationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateDestinationDto): Promise<{
        deletedAt: Date | null;
        id: number;
        createdAt: Date;
        name: string;
        slug: string;
        description: string | null;
        city: string;
        province: string;
        category: string;
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
        updatedAt: Date;
    }>;
    findAll(page: number, limit: number, search?: string, topicId?: number, topicIds?: number[], city?: string, category?: string): Promise<{
        data: {
            topics: {
                id: number;
                name: string;
                topic_name: string;
                keywords: Prisma.JsonValue;
                total_reviews: number;
            }[];
            images: {
                id: number;
                destinationId: number;
                createdAt: Date;
                imageUrl: string;
            }[];
            destinationTopics: ({
                topic: {
                    id: number;
                    topicName: string;
                    keywords: Prisma.JsonValue;
                };
            } & {
                id: number;
                destinationId: number;
                topicId: number;
                totalReviews: number;
            })[];
            deletedAt: Date | null;
            id: number;
            createdAt: Date;
            name: string;
            slug: string;
            description: string | null;
            city: string;
            province: string;
            category: string;
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
            updatedAt: Date;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            total_pages: number;
        };
    }>;
    getCategories(): readonly [{
        readonly value: "alam";
        readonly label: "Alam";
    }, {
        readonly value: "pantai";
        readonly label: "Pantai";
    }, {
        readonly value: "budaya";
        readonly label: "Budaya";
    }, {
        readonly value: "sejarah";
        readonly label: "Sejarah";
    }, {
        readonly value: "kuliner";
        readonly label: "Kuliner";
    }, {
        readonly value: "religi";
        readonly label: "Religi";
    }, {
        readonly value: "keluarga";
        readonly label: "Keluarga";
    }, {
        readonly value: "petualangan";
        readonly label: "Petualangan";
    }, {
        readonly value: "edukasi";
        readonly label: "Edukasi";
    }, {
        readonly value: "belanja";
        readonly label: "Belanja";
    }];
    getCities(): Promise<string[]>;
    findOneAdmin(id: number): Promise<{
        images: {
            id: number;
            destinationId: number;
            createdAt: Date;
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
                group: {
                    id: number;
                    createdAt: Date;
                    description: string | null;
                    updatedAt: Date;
                    keywords: Prisma.JsonValue | null;
                    groupName: string;
                    displayOrder: number;
                } | null;
            } & {
                id: number;
                createdAt: Date;
                topicName: string;
                keywords: Prisma.JsonValue | null;
                groupId: number | null;
                labelType: string;
                isSearchVisible: boolean;
                isDetailVisible: boolean;
            };
        } & {
            id: number;
            destinationId: number;
            topicId: number;
            totalReviews: number;
        })[];
        scrapingJobs: {
            id: number;
            destinationId: number;
            source: string;
            createdAt: Date;
            totalReviews: number | null;
            status: string;
            startedAt: Date | null;
            finishedAt: Date | null;
            errorMessage: string | null;
            createdBy: number | null;
        }[];
    } & {
        deletedAt: Date | null;
        id: number;
        createdAt: Date;
        name: string;
        slug: string;
        description: string | null;
        city: string;
        province: string;
        category: string;
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
        updatedAt: Date;
    }>;
    update(id: number, dto: UpdateDestinationDto): Promise<{
        deletedAt: Date | null;
        id: number;
        createdAt: Date;
        name: string;
        slug: string;
        description: string | null;
        city: string;
        province: string;
        category: string;
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
        updatedAt: Date;
    }>;
    softDelete(id: number): Promise<{
        deletedAt: Date | null;
        id: number;
        createdAt: Date;
        name: string;
        slug: string;
        description: string | null;
        city: string;
        province: string;
        category: string;
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
        updatedAt: Date;
    }>;
    updateMapsUrl(id: number, dto: UpdateMapsUrlDto): Promise<{
        deletedAt: Date | null;
        id: number;
        createdAt: Date;
        name: string;
        slug: string;
        description: string | null;
        city: string;
        province: string;
        category: string;
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
        updatedAt: Date;
    }>;
    uploadThumbnail(destinationId: number, filename: string): Promise<{
        deletedAt: Date | null;
        id: number;
        createdAt: Date;
        name: string;
        slug: string;
        description: string | null;
        city: string;
        province: string;
        category: string;
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
        updatedAt: Date;
    }>;
    uploadImage(destinationId: number, filename: string): Promise<{
        id: number;
        destinationId: number;
        createdAt: Date;
        imageUrl: string;
    }>;
    deleteImage(imageId: number): Promise<{
        id: number;
        destinationId: number;
        createdAt: Date;
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
        topicSentimentBreakdown: Record<number, {
            positive: number;
            negative: number;
            neutral: number;
        }>;
        topicGroups: {
            groupId: number;
            groupName: string;
            totalReviews: number;
            sentimentBreakdown: {
                positive: number;
                negative: number;
                neutral: number;
            };
            topics: {
                id: number;
                topicName: string;
                totalReviews: number;
            }[];
        }[];
        images: {
            id: number;
            destinationId: number;
            createdAt: Date;
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
        userReviews: ({
            user: {
                id: number;
                name: string;
                profilePicture: string | null;
            };
        } & {
            id: number;
            destinationId: number;
            reviewText: string | null;
            rating: number;
            createdAt: Date;
            userId: number;
        })[];
        destinationTopics: ({
            topic: {
                id: number;
                createdAt: Date;
                topicName: string;
                keywords: Prisma.JsonValue | null;
                groupId: number | null;
                labelType: string;
                isSearchVisible: boolean;
                isDetailVisible: boolean;
            };
        } & {
            id: number;
            destinationId: number;
            topicId: number;
            totalReviews: number;
        })[];
        deletedAt: Date | null;
        id: number;
        createdAt: Date;
        name: string;
        slug: string;
        description: string | null;
        city: string;
        province: string;
        category: string;
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
        updatedAt: Date;
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
        topicGroups: {
            groupId: number;
            groupName: string;
            totalReviews: number;
            sentimentBreakdown: {
                positive: number;
                negative: number;
                neutral: number;
            };
            topics: {
                id: number;
                topicName: string;
                totalReviews: number;
            }[];
        }[];
        images: {
            id: number;
            destinationId: number;
            createdAt: Date;
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
        userReviews: ({
            user: {
                id: number;
                name: string;
                profilePicture: string | null;
            };
        } & {
            id: number;
            destinationId: number;
            reviewText: string | null;
            rating: number;
            createdAt: Date;
            userId: number;
        })[];
        destinationTopics: ({
            topic: {
                group: {
                    id: number;
                    createdAt: Date;
                    description: string | null;
                    updatedAt: Date;
                    keywords: Prisma.JsonValue | null;
                    groupName: string;
                    displayOrder: number;
                } | null;
            } & {
                id: number;
                createdAt: Date;
                topicName: string;
                keywords: Prisma.JsonValue | null;
                groupId: number | null;
                labelType: string;
                isSearchVisible: boolean;
                isDetailVisible: boolean;
            };
        } & {
            id: number;
            destinationId: number;
            topicId: number;
            totalReviews: number;
        })[];
        deletedAt: Date | null;
        id: number;
        createdAt: Date;
        name: string;
        slug: string;
        description: string | null;
        city: string;
        province: string;
        category: string;
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
        updatedAt: Date;
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
    getReviewsByTopic(destinationId: number, topicId: number, page: number, limit: number): Promise<{
        data: {
            id: number;
            reviewerName: string;
            reviewText: string | null;
            rating: number | null;
            reviewDate: Date | null;
            likesCount: number | null;
            sentiment: string | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getReviewsByTopicGroup(destinationId: number, groupId: number, page: number, limit: number): Promise<{
        data: {
            id: number;
            reviewerName: string;
            reviewText: string | null;
            rating: number | null;
            reviewDate: Date | null;
            likesCount: number | null;
            sentiment: string | null;
            topicId: number | null;
            topic: {
                id: number;
                topicName: string;
            } | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    private buildTopicGroups;
    private buildTopicSentimentBreakdown;
    private removeFileIfExists;
}
