"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsModule = void 0;
const common_1 = require("@nestjs/common");
const topic_model_mapping_module_1 = require("../topic-mapping/topic-model-mapping.module");
const analytics_controller_1 = require("./analytics.controller");
const admin_analytics_controller_1 = require("./admin-analytics.controller");
const analytics_export_service_1 = require("./analytics-export.service");
const analytics_recalculation_service_1 = require("./analytics-recalculation.service");
const analytics_service_1 = require("./analytics.service");
const dashboard_analytics_service_1 = require("./dashboard-analytics.service");
const destination_analytics_service_1 = require("./destination-analytics.service");
const destination_comparison_insights_service_1 = require("./destination-comparison-insights.service");
const destination_comparison_service_1 = require("./destination-comparison.service");
const public_dashboard_analytics_service_1 = require("./public-dashboard-analytics.service");
let AnalyticsModule = class AnalyticsModule {
};
exports.AnalyticsModule = AnalyticsModule;
exports.AnalyticsModule = AnalyticsModule = __decorate([
    (0, common_1.Module)({
        imports: [topic_model_mapping_module_1.TopicModelMappingModule],
        controllers: [analytics_controller_1.AnalyticsController, admin_analytics_controller_1.AdminAnalyticsController],
        providers: [
            analytics_service_1.AnalyticsService,
            analytics_export_service_1.AnalyticsExportService,
            analytics_recalculation_service_1.AnalyticsRecalculationService,
            dashboard_analytics_service_1.DashboardAnalyticsService,
            destination_analytics_service_1.DestinationAnalyticsService,
            destination_comparison_insights_service_1.DestinationComparisonInsightsService,
            destination_comparison_service_1.DestinationComparisonService,
            public_dashboard_analytics_service_1.PublicDashboardAnalyticsService,
        ],
        exports: [analytics_service_1.AnalyticsService],
    })
], AnalyticsModule);
//# sourceMappingURL=analytics.module.js.map