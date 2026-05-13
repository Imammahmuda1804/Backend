import { Module } from '@nestjs/common';
import { TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';
import { NlpModule } from '../nlp/nlp.module';

@Module({
    imports: [NlpModule],
    controllers: [TopicsController],
    providers: [TopicsService],
})
export class TopicsModule { }
