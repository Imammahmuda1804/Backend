"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NlpResultStorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NlpResultStorageService = void 0;
const common_1 = require("@nestjs/common");
const nlp_destination_analytics_storage_service_1 = require("./nlp-destination-analytics-storage.service");
const nlp_review_storage_service_1 = require("./nlp-review-storage.service");
const nlp_topic_storage_service_1 = require("./nlp-topic-storage.service");
let NlpResultStorageService = NlpResultStorageService_1 = class NlpResultStorageService {
    topicStorage;
    reviewStorage;
    destinationAnalytics;
    logger = new common_1.Logger(NlpResultStorageService_1.name);
    constructor(topicStorage, reviewStorage, destinationAnalytics) {
        this.topicStorage = topicStorage;
        this.reviewStorage = reviewStorage;
        this.destinationAnalytics = destinationAnalytics;
    }
    async saveNlpResults(destinationId, nlpResult, reviewIds) {
        this.logPipelineResult(destinationId, nlpResult);
        const savedTopicIds = await this.topicStorage.saveTopics(nlpResult);
        await this.reviewStorage.save(destinationId, nlpResult, reviewIds, savedTopicIds);
        await this.destinationAnalytics.refresh(destinationId);
    }
    logPipelineResult(destinationId, nlpResult) {
        this.logger.log(`NLP result summary for destination ${destinationId}: ${JSON.stringify(nlpResult.summary)}`);
        this.logDiscoveredTopics(nlpResult.new_topics?.length ?? 0);
        this.logPipelineWarning(nlpResult.warning);
        this.logModelMetadata(nlpResult.metadata);
    }
    logDiscoveredTopics(topicCount) {
        if (topicCount === 0)
            return;
        this.logger.log(`${topicCount} new topics discovered by NLP pipeline`);
    }
    logPipelineWarning(warning) {
        if (!warning)
            return;
        this.logger.warn(`Pipeline warning: ${warning}`);
    }
    logModelMetadata(metadata) {
        if (!metadata)
            return;
        this.logger.log(`NLP model metadata: ${JSON.stringify(metadata)}`);
    }
};
exports.NlpResultStorageService = NlpResultStorageService;
exports.NlpResultStorageService = NlpResultStorageService = NlpResultStorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [nlp_topic_storage_service_1.NlpTopicStorageService,
        nlp_review_storage_service_1.NlpReviewStorageService,
        nlp_destination_analytics_storage_service_1.NlpDestinationAnalyticsStorageService])
], NlpResultStorageService);
//# sourceMappingURL=nlp-result-storage.service.js.map