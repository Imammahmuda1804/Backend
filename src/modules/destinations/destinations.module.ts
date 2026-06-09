import { Module } from '@nestjs/common';
import { DestinationsService } from './destinations.service';
import { AdminDestinationsController } from './admin-destinations.controller';
import { DestinationsController } from './destinations.controller';
import { ScraperModule } from '../scraper/scraper.module';
import { DestinationAdminService } from './destination-admin.service';
import { DestinationCatalogService } from './destination-catalog.service';
import { DestinationDetailService } from './destination-detail.service';

@Module({
  imports: [ScraperModule],
  controllers: [AdminDestinationsController, DestinationsController],
  providers: [
    DestinationsService,
    DestinationAdminService,
    DestinationCatalogService,
    DestinationDetailService,
  ],
  exports: [DestinationsService],
})
export class DestinationsModule {}
