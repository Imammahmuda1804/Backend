import { Injectable } from '@nestjs/common';
import { AnalyticsExportService } from './analytics-export.service';
import { AnalyticsRecalculationService } from './analytics-recalculation.service';
import { AnalyticsPeriod } from './analytics.types';
import { DashboardAnalyticsService } from './dashboard-analytics.service';
import { DestinationAnalyticsService } from './destination-analytics.service';
import { DestinationComparisonService } from './destination-comparison.service';
import { PublicDashboardAnalyticsService } from './public-dashboard-analytics.service';

/**
 * Facade analytics yang menjadi pintu masuk controller.
 *
 * Setiap pekerjaan diteruskan ke service yang memiliki satu tanggung jawab.
 * Pola ini menjaga nama method publik tetap sama sehingga endpoint API dan
 * pemanggil lama tidak perlu berubah.
 */
@Injectable()
export class AnalyticsService {
  constructor(
    private readonly dashboardAnalytics: DashboardAnalyticsService,
    private readonly publicDashboard: PublicDashboardAnalyticsService,
    private readonly destinationAnalytics: DestinationAnalyticsService,
    private readonly destinationComparison: DestinationComparisonService,
    private readonly analyticsExport: AnalyticsExportService,
    private readonly analyticsRecalculation: AnalyticsRecalculationService,
  ) {}

  getPublicDashboard() {
    return this.publicDashboard.getDashboard();
  }

  getAdminSummary() {
    return this.dashboardAnalytics.getAdminSummary();
  }

  getAdminActivity() {
    return this.dashboardAnalytics.getAdminActivity();
  }

  getAdminTrends(period: AnalyticsPeriod = 'monthly') {
    return this.dashboardAnalytics.getAdminTrends(period);
  }

  getDestinationAnalytics(destinationId: number) {
    return this.destinationAnalytics.getSummary(destinationId);
  }

  getDestinationTopics(destinationId: number) {
    return this.destinationAnalytics.getTopics(destinationId);
  }

  getDestinationTrends(
    destinationId: number,
    period: AnalyticsPeriod = 'monthly',
  ) {
    return this.destinationAnalytics.getTrends(destinationId, period);
  }

  compareDestinations(destination1Id: number, destination2Id: number) {
    return this.destinationComparison.compare(destination1Id, destination2Id);
  }

  exportAnalyticsCsv(destinationId: number) {
    return this.analyticsExport.exportDestination(destinationId);
  }

  recalculateAnalytics(destinationId: number) {
    return this.analyticsRecalculation.recalculate(destinationId);
  }
}
