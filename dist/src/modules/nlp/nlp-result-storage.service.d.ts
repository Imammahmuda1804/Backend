import { PrismaService } from '../../prisma/prisma.service';
import { VectorService } from '../vector/vector.service';
import { AiNamingService } from './ai-naming.service';
import { NlpPipelineResult } from './interfaces/nlp-pipeline-result.interface';
export declare class NlpResultStorageService {
    private readonly prisma;
    private readonly vectorService;
    private readonly aiNamingService;
    private readonly logger;
    constructor(prisma: PrismaService, vectorService: VectorService, aiNamingService: AiNamingService);
    saveNlpResults(destinationId: number, nlpResult: NlpPipelineResult, reviewIds: number[]): Promise<void>;
    private logPipelineResult;
    private saveTopics;
    private findTopicByNormalizedName;
    private mergeTopicKeywords;
    private updateReviews;
    private saveReviewEmbeddings;
    private saveDestinationEmbedding;
    private calculateRecommendationScore;
    private updateDestinationTopics;
    private updateSentimentTrends;
}
