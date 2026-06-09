"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const analytics_export_service_1 = require("./analytics-export.service");
const analytics_recalculation_service_1 = require("./analytics-recalculation.service");
const dashboard_analytics_service_1 = require("./dashboard-analytics.service");
const destination_analytics_service_1 = require("./destination-analytics.service");
const destination_comparison_service_1 = require("./destination-comparison.service");
const public_dashboard_analytics_service_1 = require("./public-dashboard-analytics.service");
let AnalyticsService = class AnalyticsService {
    dashboardAnalytics;
    publicDashboard;
    destinationAnalytics;
    destinationComparison;
    analyticsExport;
    analyticsRecalculation;
    constructor(dashboardAnalytics, publicDashboard, destinationAnalytics, destinationComparison, analyticsExport, analyticsRecalculation) {
        this.dashboardAnalytics = dashboardAnalytics;
        this.publicDashboard = publicDashboard;
        this.destinationAnalytics = destinationAnalytics;
        this.destinationComparison = destinationComparison;
        this.analyticsExport = analyticsExport;
        this.analyticsRecalculation = analyticsRecalculation;
    }
    getPublicDashboard() {
        return this.publicDashboard.getDashboard();
    }
    getAdminSummary() {
        return this.dashboardAnalytics.getAdminSummary();
    }
    getAdminActivity() {
        return this.dashboardAnalytics.getAdminActivity();
    }
    getAdminTrends(period = 'monthly') {
        return this.dashboardAnalytics.getAdminTrends(period);
    }
    getDestinationAnalytics(destinationId) {
        return this.destinationAnalytics.getSummary(destinationId);
    }
    getDestinationTopics(destinationId) {
        return this.destinationAnalytics.getTopics(destinationId);
    }
    getDestinationTrends(destinationId, period = 'monthly') {
        return this.destinationAnalytics.getTrends(destinationId, period);
    }
    compareDestinations(destination1Id, destination2Id) {
        return this.destinationComparison.compare(destination1Id, destination2Id);
    }
    exportAnalyticsCsv(destinationId) {
        return this.analyticsExport.exportDestination(destinationId);
    }
    recalculateAnalytics(destinationId) {
        return this.analyticsRecalculation.recalculate(destinationId);
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [dashboard_analytics_service_1.DashboardAnalyticsService,
        public_dashboard_analytics_service_1.PublicDashboardAnalyticsService,
        destination_analytics_service_1.DestinationAnalyticsService,
        destination_comparison_service_1.DestinationComparisonService,
        analytics_export_service_1.AnalyticsExportService,
        analytics_recalculation_service_1.AnalyticsRecalculationService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map