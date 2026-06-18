import { Module } from '@nestjs/common';
import { ReviewTopicPersistenceService } from './review-topic-persistence.service';
import { ReviewTopicQueryService } from './review-topic-query.service';
import { TopicModelMappingService } from './topic-model-mapping.service';

@Module({
  providers: [
    TopicModelMappingService,
    ReviewTopicPersistenceService,
    ReviewTopicQueryService,
  ],
  exports: [
    TopicModelMappingService,
    ReviewTopicPersistenceService,
    ReviewTopicQueryService,
  ],
})
export class TopicModelMappingModule {}
