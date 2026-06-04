import { Module } from '@nestjs/common';
import { AdminTopicsController, TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';
import { NlpModule } from '../nlp/nlp.module';

@Module({
  imports: [NlpModule],
  controllers: [TopicsController, AdminTopicsController],
  providers: [TopicsService],
})
export class TopicsModule {}
