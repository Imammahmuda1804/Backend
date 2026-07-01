"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NlpModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const bullmq_1 = require("@nestjs/bullmq");
const nlp_service_1 = require("./nlp.service");
const nlp_result_storage_service_1 = require("./nlp-result-storage.service");
const vector_module_1 = require("../vector/vector.module");
const ai_naming_service_1 = require("./ai-naming.service");
const nlp_controller_1 = require("./nlp.controller");
const nlp_upload_service_1 = require("./nlp-upload.service");
const nlp_review_dedup_service_1 = require("./nlp-review-dedup.service");
const csv_service_1 = require("../scraper/csv.service");
const nlp_destination_analytics_storage_service_1 = require("./nlp-destination-analytics-storage.service");
const nlp_review_storage_service_1 = require("./nlp-review-storage.service");
const nlp_topic_storage_service_1 = require("./nlp-topic-storage.service");
const nlp_upload_preparation_service_1 = require("./nlp-upload-preparation.service");
const nlp_processing_history_service_1 = require("./nlp-processing-history.service");
const nlp_pipeline_runner_service_1 = require("./nlp-pipeline-runner.service");
const nlp_upload_execution_service_1 = require("./nlp-upload-execution.service");
const topic_name_policy_service_1 = require("./topic-name-policy.service");
const topic_group_classifier_service_1 = require("./topic-group-classifier.service");
const topic_model_mapping_module_1 = require("../topic-mapping/topic-model-mapping.module");
const nlp_queue_processor_1 = require("./nlp-queue.processor");
let NlpModule = class NlpModule {
};
exports.NlpModule = NlpModule;
exports.NlpModule = NlpModule = __decorate([
    (0, common_1.Module)({
        imports: [
            axios_1.HttpModule,
            vector_module_1.VectorModule,
            topic_model_mapping_module_1.TopicModelMappingModule,
            bullmq_1.BullModule.registerQueue({ name: 'nlp-queue' }),
        ],
        controllers: [nlp_controller_1.NlpController],
        providers: [
            nlp_service_1.NlpService,
            nlp_upload_service_1.NlpUploadService,
            nlp_upload_preparation_service_1.NlpUploadPreparationService,
            nlp_processing_history_service_1.NlpProcessingHistoryService,
            nlp_pipeline_runner_service_1.NlpPipelineRunnerService,
            nlp_upload_execution_service_1.NlpUploadExecutionService,
            topic_name_policy_service_1.TopicNamePolicyService,
            topic_group_classifier_service_1.TopicGroupClassifierService,
            nlp_review_dedup_service_1.NlpReviewDedupService,
            nlp_result_storage_service_1.NlpResultStorageService,
            nlp_topic_storage_service_1.NlpTopicStorageService,
            nlp_review_storage_service_1.NlpReviewStorageService,
            nlp_destination_analytics_storage_service_1.NlpDestinationAnalyticsStorageService,
            ai_naming_service_1.AiNamingService,
            csv_service_1.CsvService,
            nlp_queue_processor_1.NlpQueueProcessor,
        ],
        exports: [nlp_service_1.NlpService, nlp_result_storage_service_1.NlpResultStorageService, ai_naming_service_1.AiNamingService],
    })
], NlpModule);
//# sourceMappingURL=nlp.module.js.map