import { NlpDestinationAnalyticsStorageService } from './nlp-destination-analytics-storage.service';
import { NlpPipelineResult } from './interfaces/nlp-pipeline-result.interface';
import { NlpReviewStorageService } from './nlp-review-storage.service';
import { NlpTopicStorageService } from './nlp-topic-storage.service';
export declare class NlpResultStorageService {
    private readonly topicStorage;
    private readonly reviewStorage;
    private readonly destinationAnalytics;
    private readonly logger;
    constructor(topicStorage: NlpTopicStorageService, reviewStorage: NlpReviewStorageService, destinationAnalytics: NlpDestinationAnalyticsStorageService);
    saveNlpResults(destinationId: number, nlpResult: NlpPipelineResult, reviewIds: number[]): Promise<void>;
    private logPipelineResult;
    private logDiscoveredTopics;
    private logPipelineWarning;
    private logModelMetadata;
}
