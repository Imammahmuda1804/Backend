export interface SimilarDestination {
    id: number;
    name: string;
    slug: string;
    city: string;
    province: string;
    thumbnail_url: string;
    google_rating: number;
    user_rating: number;
    positive_ratio: number;
    recommendation_score: number;
    distance?: number;
    hybrid_score?: number;
}
