import { Module } from '@nestjs/common';
import { TopicModelMappingModule } from '../topic-mapping/topic-model-mapping.module';
import { DestinationsService } from './destinations.service';
import { AdminDestinationsController } from './admin-destinations.controller';
import { DestinationsController } from './destinations.controller';
import { ScraperModule } from '../scraper/scraper.module';
import { StorageModule } from '../storage/storage.module';
import { DestinationAdminService } from './destination-admin.service';
import { DestinationCatalogService } from './destination-catalog.service';
import { DestinationDetailService } from './destination-detail.service';

@Module({
  imports: [ScraperModule, StorageModule, TopicModelMappingModule],
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
