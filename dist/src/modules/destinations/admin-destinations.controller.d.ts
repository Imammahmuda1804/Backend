import type { Request } from 'express';
import { DestinationsService } from './destinations.service';
import { ScraperService } from '../scraper/scraper.service';
import { StartScrapingDto } from '../scraper/dto';
import type { MulterFile } from '../../config/multer.config';
import { CreateDestinationDto, UpdateDestinationDto, DestinationQueryDto, UpdateMapsUrlDto } from './dto';
interface RequestWithUser extends Request {
    user?: {
        id: number;
        [key: string]: any;
    };
}
declare const ScrapeDestinationDto_base: import("@nestjs/common").Type<Omit<StartScrapingDto, "destination_id">>;
export declare class ScrapeDestinationDto extends ScrapeDestinationDto_base {
}
export declare class AdminDestinationsController {
    private readonly destinationsService;
    private readonly scraperService;
    constructor(destinationsService: DestinationsService, scraperService: ScraperService);
    create(dto: CreateDestinationDto): Promise<{
        createdAt: Date;
        id: number;
        name: string;
        description: string | null;
        slug: string;
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
        deletedAt: Date | null;
    }>;
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
                createdAt: Date;
                id: number;
                destinationId: number;
                imageUrl: string;
            }[];
            destinationTopics: ({
                topic: {
                    id: number;
                    topicName: string;
                    keywords: import("@prisma/client/runtime/client").JsonValue;
                };
            } & {
                id: number;
                destinationId: number;
                totalReviews: number;
                topicId: number;
            })[];
            createdAt: Date;
            id: number;
            name: string;
            description: string | null;
            slug: string;
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
            deletedAt: Date | null;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            total_pages: number;
        };
    }>;
    findOne(id: number): Promise<{
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
                group: {
                    createdAt: Date;
                    id: number;
                    description: string | null;
                    updatedAt: Date;
                    keywords: import("@prisma/client/runtime/client").JsonValue | null;
                    groupName: string;
                    displayOrder: number;
                } | null;
            } & {
                createdAt: Date;
                id: number;
                topicName: string;
                keywords: import("@prisma/client/runtime/client").JsonValue | null;
                groupId: number | null;
                labelType: string;
                isSearchVisible: boolean;
                isDetailVisible: boolean;
            };
        } & {
            id: number;
            destinationId: number;
            totalReviews: number;
            topicId: number;
        })[];
        scrapingJobs: {
            createdAt: Date;
            id: number;
            destinationId: number;
            status: string;
            source: string;
            totalReviews: number | null;
            startedAt: Date | null;
            finishedAt: Date | null;
            errorMessage: string | null;
            createdBy: number | null;
        }[];
    } & {
        createdAt: Date;
        id: number;
        name: string;
        description: string | null;
        slug: string;
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
        deletedAt: Date | null;
    }>;
    update(id: number, dto: UpdateDestinationDto): Promise<{
        createdAt: Date;
        id: number;
        name: string;
        description: string | null;
        slug: string;
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
        deletedAt: Date | null;
    }>;
    softDelete(id: number): Promise<{
        createdAt: Date;
        id: number;
        name: string;
        description: string | null;
        slug: string;
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
        deletedAt: Date | null;
    }>;
    updateMapsUrl(id: number, dto: UpdateMapsUrlDto): Promise<{
        createdAt: Date;
        id: number;
        name: string;
        description: string | null;
        slug: string;
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
        deletedAt: Date | null;
    }>;
    uploadThumbnail(id: number, file: MulterFile): Promise<{
        createdAt: Date;
        id: number;
        name: string;
        description: string | null;
        slug: string;
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
        deletedAt: Date | null;
    }>;
    uploadImage(id: number, file: MulterFile): Promise<{
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
    scrapeDestination(id: number, dto: ScrapeDestinationDto, req: RequestWithUser): Promise<{
        job_id: number;
        status: string;
        destination_name: string;
        maps_url: string;
        message: string;
    }>;
}
export {};
