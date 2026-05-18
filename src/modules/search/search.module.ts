import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { NlpModule } from '../nlp/nlp.module';
import { VectorModule } from '../vector/vector.module';

@Module({
  imports: [
    NlpModule, // provides NlpService (embedQuery)
    VectorModule, // provides VectorService (hybridSearch)
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
