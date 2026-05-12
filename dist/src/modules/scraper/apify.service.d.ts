export declare class ApifyService {
    private client;
    private readonly logger;
    private readonly MAPS_EXTRACTOR_ACTOR_ID;
    private readonly MAPS_REVIEWS_ACTOR_ID;
    constructor();
    searchPlaces(query: string): Promise<{
        title: string | undefined;
        address: string | undefined;
        rating: number | undefined;
        totalReviews: number | undefined;
        placeId: string | undefined;
        url: string | undefined;
    }[]>;
    startReviewScraping(url: string, maxReviews?: number): Promise<import("apify-client").ActorRun>;
    waitForRun(runId: string): Promise<import("apify-client").ActorRun>;
    getRunResults(datasetId: string): Promise<Record<string | number, unknown>[]>;
}
