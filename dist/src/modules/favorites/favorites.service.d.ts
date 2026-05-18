import { PrismaService } from '../../prisma/prisma.service';
export declare class FavoritesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    addFavorite(userId: number, destinationId: number): Promise<{
        message: string;
    }>;
    getFavorites(userId: number, page: number, limit: number): Promise<{
        data: {
            destination: {
                name: string;
                id: number;
                slug: string;
                city: string;
                province: string;
                googleRating: number | null;
                thumbnailUrl: string | null;
                positiveRatio: number | null;
                recommendationScore: number | null;
            };
            createdAt: Date;
            id: number;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            total_pages: number;
        };
    }>;
    removeFavorite(userId: number, destinationId: number): Promise<{
        message: string;
    }>;
    checkFavorite(userId: number, destinationId: number): Promise<{
        isFavorite: boolean;
    }>;
}
