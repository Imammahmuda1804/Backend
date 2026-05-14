import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScraperService } from './scraper.service';
import { ScraperController } from './scraper.controller';
import { ApifyService } from './apify.service';
import { ScraperProcessor } from './scraper.processor';
import { HttpModule } from '@nestjs/axios';
import { CsvService } from './csv.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'scraping-queue',
    }),
    HttpModule,
  ],
  controllers: [ScraperController],
  providers: [
    ScraperService,
    ApifyService,
    ScraperProcessor,
    CsvService,
  ],
  exports: [ScraperService],
})
export class ScraperModule {}
