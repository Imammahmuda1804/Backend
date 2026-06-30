import { FavoritesService } from './favorites.service';
export declare class FavoritesController {
    private readonly favoritesService;
    constructor(favoritesService: FavoritesService);
    addFavorite(destinationId: number, userId: number): Promise<{
        message: string;
    }>;
    getFavorites(userId: number, page?: string, limit?: string): Promise<{
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
    removeFavorite(destinationId: number, userId: number): Promise<{
        message: string;
    }>;
    checkFavorite(destinationId: number, userId: number): Promise<{
        isFavorite: boolean;
    }>;
}
