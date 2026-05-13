import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NlpService } from './nlp.service';
import { NlpResultStorageService } from './nlp-result-storage.service';
import { VectorModule } from '../vector/vector.module';
import { AiNamingService } from './ai-naming.service';

@Module({
  imports: [HttpModule, VectorModule],
  providers: [NlpService, NlpResultStorageService, AiNamingService],
  exports: [NlpService, NlpResultStorageService, AiNamingService],
})
export class NlpModule {}
