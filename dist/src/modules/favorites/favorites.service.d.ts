import { PrismaService } from '../../prisma/prisma.service';
export declare class FavoritesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    addFavorite(userId: number, destinationId: number): Promise<{
        message: string;
    }>;
    private ensureDestinationExists;
    private createFavoriteOrReturnExisting;
    private isUniqueConstraintError;
    private existingFavorite;
    getFavorites(userId: number, page: number, limit: number): Promise<{
        data: {
            id: number;
            createdAt: Date;
            destination: {
                id: number;
                name: string;
                city: string;
                slug: string;
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
    checkFavorite(userId: number, destinationId: number): Promise<{
        isFavorite: boolean;
    }>;
}
