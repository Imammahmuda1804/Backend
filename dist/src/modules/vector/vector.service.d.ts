import { PrismaService } from '../../prisma/prisma.service';
import { SimilarDestination } from './interfaces/similar-destination.interface';
export declare class VectorService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private chunkArray;
    upsertDestinationEmbedding(destinationId: number, embedding: number[]): Promise<void>;
    insertReviewEmbedding(reviewId: number, embedding: number[]): Promise<void>;
    batchInsertReviewEmbeddings(items: Array<{
        reviewId: number;
        embedding: number[];
    }>): Promise<void>;
    searchSimilarDestinations(queryEmbedding: number[], limit?: number): Promise<SimilarDestination[]>;
    hybridSearch(queryEmbedding: number[], limit?: number): Promise<SimilarDestination[]>;
}
