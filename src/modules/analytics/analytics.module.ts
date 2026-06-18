import { Module } from '@nestjs/common';
import { TopicModelMappingModule } from '../topic-mapping/topic-model-mapping.module';
import { AnalyticsController } from './analytics.controller';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { AnalyticsExportService } from './analytics-export.service';
import { AnalyticsRecalculationService } from './analytics-recalculation.service';
import { AnalyticsService } from './analytics.service';
import { DashboardAnalyticsService } from './dashboard-analytics.service';
import { DestinationAnalyticsService } from './destination-analytics.service';
import { DestinationComparisonInsightsService } from './destination-comparison-insights.service';
import { DestinationComparisonService } from './destination-comparison.service';
import { PublicDashboardAnalyticsService } from './public-dashboard-analytics.service';

@Module({
  imports: [TopicModelMappingModule],
  controllers: [AnalyticsController, AdminAnalyticsController],
  providers: [
    AnalyticsService,
    AnalyticsExportService,
    AnalyticsRecalculationService,
    DashboardAnalyticsService,
    DestinationAnalyticsService,
    DestinationComparisonInsightsService,
    DestinationComparisonService,
    PublicDashboardAnalyticsService,
  ],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
