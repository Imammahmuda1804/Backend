import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScraperService } from './scraper.service';
import { ScraperController } from './scraper.controller';
import { ApifyService } from './apify.service';
import { ScraperProcessor } from './scraper.processor';
import { HttpModule } from '@nestjs/axios';
import { CsvService } from './csv.service';
import { NlpProcessProcessor } from './nlp-process.processor';
import { NlpModule } from '../nlp/nlp.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'scraping-queue',
    }),
    BullModule.registerQueue({
      name: 'nlp-queue',
    }),
    HttpModule,
    NlpModule,
  ],
  controllers: [ScraperController],
  providers: [
    ScraperService,
    ApifyService,
    ScraperProcessor,
    CsvService,
    NlpProcessProcessor,
  ],
  exports: [ScraperService],
})
export class ScraperModule {}
