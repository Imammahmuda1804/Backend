import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { NlpModule } from '../nlp/nlp.module';
import { VectorModule } from '../vector/vector.module';

@Module({
  imports: [
    NlpModule, // Menyediakan NlpService.
    VectorModule, // Menyediakan VectorService.
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
