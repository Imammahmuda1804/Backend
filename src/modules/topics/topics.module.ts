import { Module } from '@nestjs/common';
import { AdminTopicsController, TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';
import { NlpModule } from '../nlp/nlp.module';
import { TopicGroupService } from './topic-group.service';
import { TopicManagementService } from './topic-management.service';
import { TopicMergeService } from './topic-merge.service';
import { TopicQueryService } from './topic-query.service';
import { TopicReviewService } from './topic-review.service';

@Module({
  imports: [NlpModule],
  controllers: [TopicsController, AdminTopicsController],
  providers: [
    TopicsService,
    TopicQueryService,
    TopicReviewService,
    TopicMergeService,
    TopicGroupService,
    TopicManagementService,
  ],
})
export class TopicsModule {}
