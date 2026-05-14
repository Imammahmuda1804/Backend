import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NlpService } from './nlp.service';
import { NlpResultStorageService } from './nlp-result-storage.service';
import { VectorModule } from '../vector/vector.module';
import { AiNamingService } from './ai-naming.service';
import { NlpController } from './nlp.controller';
import { CsvService } from '../scraper/csv.service';

@Module({
  imports: [HttpModule, VectorModule],
  controllers: [NlpController],
  providers: [NlpService, NlpResultStorageService, AiNamingService, CsvService],
  exports: [NlpService, NlpResultStorageService, AiNamingService],
})
export class NlpModule {}
