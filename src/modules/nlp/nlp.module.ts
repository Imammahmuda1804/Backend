import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NlpService } from './nlp.service';
import { NlpResultStorageService } from './nlp-result-storage.service';
import { VectorModule } from '../vector/vector.module';

@Module({
  imports: [HttpModule, VectorModule],
  providers: [NlpService, NlpResultStorageService],
  exports: [NlpService, NlpResultStorageService],
})
export class NlpModule {}
