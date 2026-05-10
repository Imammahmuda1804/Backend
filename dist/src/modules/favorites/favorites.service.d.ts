import { PrismaService } from '../../prisma/prisma.service';
export declare class FavoritesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    addFavorite(userId: number, destinationId: number): Promise<{
        message: string;
    }>;
    getFavorites(userId: number, page: number, limit: number): Promise<{
        data: {
            id: number;
            createdAt: Date;
            destination: {
                id: number;
                name: string;
                slug: string;
                city: string;
                province: string;
                googleRating: number | null;
                thumbnailUrl: string | null;
                positiveRatio: number | null;
                recommendationScore: number | null;
            };
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
}
