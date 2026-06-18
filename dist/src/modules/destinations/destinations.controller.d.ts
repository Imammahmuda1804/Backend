import { DestinationsService } from './destinations.service';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { DestinationQueryDto } from './dto/destination-query.dto';
export declare class DestinationsController {
    private readonly destinationsService;
    constructor(destinationsService: DestinationsService);
    getCities(): Promise<string[]>;
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
    findAll(query: DestinationQueryDto): Promise<{
        data: {
            topics: {
                id: number;
                name: string;
                topic_name: string;
                keywords: import("@prisma/client/runtime/client").JsonValue;
                total_reviews: number;
            }[];
            images: {
                id: number;
                createdAt: Date;
                destinationId: number;
                imageUrl: string;
            }[];
            destinationTopics: ({
                topic: {
                    id: number;
                    keywords: import("@prisma/client/runtime/client").JsonValue;
                    topicName: string;
                };
            } & {
                id: number;
                destinationId: number;
                totalReviews: number;
                topicId: number;
            })[];
            id: number;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            city: string;
            slug: string;
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
            deletedAt: Date | null;
        }[];
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
            description: string | null;
            city: string;
            slug: string;
            province: string;
            latitude: number | null;
            longitude: number | null;
            googleMapsUrl: string | null;
            googlePlaceId: string | null;
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
        city: string;
        slug: string;
        province: string;
        latitude: number | null;
        longitude: number | null;
        googleMapsUrl: string | null;
        googlePlaceId: string | null;
        googleRating: number | null;
        userRating: number | null;
        thumbnailUrl: string | null;
        positiveRatio: number | null;
        recommendationScore: number | null;
    }[]>;
    getDetailBySlug(slug: string): Promise<{
        favorites: {
            id: number;
            createdAt: Date;
            userId: number;
            destinationId: number;
        }[];
        userReviews: {
            id: number;
            createdAt: Date;
            userId: number;
            destinationId: number;
            rating: number;
            reviewText: string | null;
        }[];
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
        nlpProcessingRuns: {
            id: number;
            status: string;
            createdAt: Date;
            destinationId: number;
            startedAt: Date;
            finishedAt: Date | null;
            errorMessage: string | null;
            adminId: number | null;
            fileName: string;
            fileHash: string;
            mode: string;
            totalRows: number;
            insertedReviews: number;
            skippedDuplicates: number;
            processedReviews: number;
        }[];
        _count: {
            images: number;
            reviews: number;
            sentimentTrends: number;
            favorites: number;
            userReviews: number;
            destinationTopics: number;
            scrapingJobs: number;
            scrapingHistories: number;
            routeStops: number;
            nlpProcessingRuns: number;
        };
        images: {
            id: number;
            createdAt: Date;
            destinationId: number;
            imageUrl: string;
        }[];
        reviews: {
            id: number;
            createdAt: Date;
            destinationId: number;
            rating: number | null;
            reviewText: string | null;
            source: string | null;
            reviewerName: string;
            cleanedText: string | null;
            reviewDate: Date | null;
            reviewHash: string | null;
            likesCount: number | null;
            ownerReply: string | null;
            sentiment: string | null;
            sentimentConfidence: number | null;
            topicId: number | null;
            scrapingJobId: number | null;
        }[];
        sentimentTrends: {
            id: number;
            destinationId: number;
            date: Date;
            positiveCount: number;
            negativeCount: number;
            neutralCount: number;
        }[];
        destinationTopics: {
            id: number;
            destinationId: number;
            totalReviews: number;
            topicId: number;
        }[];
        scrapingHistories: {
            id: number;
            createdAt: Date;
            destinationId: number;
            totalReviews: number | null;
            jobId: number;
            starsFilter: import("@prisma/client/runtime/client").JsonValue | null;
            hasText: boolean | null;
            sort: string | null;
        }[];
        routeStops: {
            id: number;
            destinationId: number;
            routeId: number;
            stopOrder: number;
            distanceFromPreviousKm: number | null;
            distanceToNextKm: number | null;
            note: string | null;
            estimatedVisitMinutes: number | null;
        }[];
    } & {
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        city: string;
        slug: string;
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
        deletedAt: Date | null;
    } & {
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
    }>;
    getReviewsByTopic(id: number, topicIdStr: string, pageStr: string, limitStr: string): Promise<{
        data: ({
            id: number;
            rating: number | null;
            reviewText: string | null;
            reviewerName: string;
            reviewDate: Date | null;
            likesCount: number | null;
            sentiment: string | null;
        } & {
            topicAssignments: import("../topic-mapping/review-topic-query.service").ReviewTopicAssignment[];
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getReviewsByTopicGroup(id: number, groupIdStr: string, pageStr: string, limitStr: string): Promise<{
        data: ({
            id: number;
            rating: number | null;
            reviewText: string | null;
            topic: {
                id: number;
                topicName: string;
            } | null;
            reviewerName: string;
            reviewDate: Date | null;
            likesCount: number | null;
            sentiment: string | null;
            topicId: number | null;
        } & {
            topicAssignments: import("../topic-mapping/review-topic-query.service").ReviewTopicAssignment[];
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getDetail(id: number): Promise<{
        favorites: {
            id: number;
            createdAt: Date;
            userId: number;
            destinationId: number;
        }[];
        userReviews: {
            id: number;
            createdAt: Date;
            userId: number;
            destinationId: number;
            rating: number;
            reviewText: string | null;
        }[];
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
        nlpProcessingRuns: {
            id: number;
            status: string;
            createdAt: Date;
            destinationId: number;
            startedAt: Date;
            finishedAt: Date | null;
            errorMessage: string | null;
            adminId: number | null;
            fileName: string;
            fileHash: string;
            mode: string;
            totalRows: number;
            insertedReviews: number;
            skippedDuplicates: number;
            processedReviews: number;
        }[];
        _count: {
            images: number;
            reviews: number;
            sentimentTrends: number;
            favorites: number;
            userReviews: number;
            destinationTopics: number;
            scrapingJobs: number;
            scrapingHistories: number;
            routeStops: number;
            nlpProcessingRuns: number;
        };
        images: {
            id: number;
            createdAt: Date;
            destinationId: number;
            imageUrl: string;
        }[];
        reviews: {
            id: number;
            createdAt: Date;
            destinationId: number;
            rating: number | null;
            reviewText: string | null;
            source: string | null;
            reviewerName: string;
            cleanedText: string | null;
            reviewDate: Date | null;
            reviewHash: string | null;
            likesCount: number | null;
            ownerReply: string | null;
            sentiment: string | null;
            sentimentConfidence: number | null;
            topicId: number | null;
            scrapingJobId: number | null;
        }[];
        sentimentTrends: {
            id: number;
            destinationId: number;
            date: Date;
            positiveCount: number;
            negativeCount: number;
            neutralCount: number;
        }[];
        destinationTopics: {
            id: number;
            destinationId: number;
            totalReviews: number;
            topicId: number;
        }[];
        scrapingHistories: {
            id: number;
            createdAt: Date;
            destinationId: number;
            totalReviews: number | null;
            jobId: number;
            starsFilter: import("@prisma/client/runtime/client").JsonValue | null;
            hasText: boolean | null;
            sort: string | null;
        }[];
        routeStops: {
            id: number;
            destinationId: number;
            routeId: number;
            stopOrder: number;
            distanceFromPreviousKm: number | null;
            distanceToNextKm: number | null;
            note: string | null;
            estimatedVisitMinutes: number | null;
        }[];
    } & {
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        city: string;
        slug: string;
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
        deletedAt: Date | null;
    } & {
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
    }>;
}
