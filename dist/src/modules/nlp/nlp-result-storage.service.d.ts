import { PrismaService } from '../../prisma/prisma.service';
import { VectorService } from '../vector/vector.service';
import { NlpPipelineResult } from './interfaces/nlp-pipeline-result.interface';
export declare class NlpResultStorageService {
    private readonly prisma;
    private readonly vectorService;
    constructor(prisma: PrismaService, vectorService: VectorService);
    saveNlpResults(destinationId: number, nlpResult: NlpPipelineResult, reviewIds: number[]): Promise<void>;
    private calculateRecommendationScore;
    private updateDestinationTopics;
    private updateSentimentTrends;
}
