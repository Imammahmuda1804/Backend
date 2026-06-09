import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NlpService } from './nlp.service';
import { NlpResultStorageService } from './nlp-result-storage.service';
import { VectorModule } from '../vector/vector.module';
import { AiNamingService } from './ai-naming.service';
import { NlpController } from './nlp.controller';
import { NlpUploadService } from './nlp-upload.service';
import { NlpReviewDedupService } from './nlp-review-dedup.service';
import { CsvService } from '../scraper/csv.service';
import { NlpDestinationAnalyticsStorageService } from './nlp-destination-analytics-storage.service';
import { NlpReviewStorageService } from './nlp-review-storage.service';
import { NlpTopicStorageService } from './nlp-topic-storage.service';
import { NlpUploadPreparationService } from './nlp-upload-preparation.service';
import { NlpProcessingHistoryService } from './nlp-processing-history.service';
import { NlpPipelineRunnerService } from './nlp-pipeline-runner.service';
import { NlpUploadExecutionService } from './nlp-upload-execution.service';
import { TopicNamePolicyService } from './topic-name-policy.service';
import { TopicGroupClassifierService } from './topic-group-classifier.service';

@Module({
  imports: [HttpModule, VectorModule],
  controllers: [NlpController],
  providers: [
    NlpService,
    NlpUploadService,
    NlpUploadPreparationService,
    NlpProcessingHistoryService,
    NlpPipelineRunnerService,
    NlpUploadExecutionService,
    TopicNamePolicyService,
    TopicGroupClassifierService,
    NlpReviewDedupService,
    NlpResultStorageService,
    NlpTopicStorageService,
    NlpReviewStorageService,
    NlpDestinationAnalyticsStorageService,
    AiNamingService,
    CsvService,
  ],
  exports: [NlpService, NlpResultStorageService, AiNamingService],
})
export class NlpModule {}
