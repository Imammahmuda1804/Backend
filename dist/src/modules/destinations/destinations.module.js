"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DestinationsModule = void 0;
const common_1 = require("@nestjs/common");
const destinations_service_1 = require("./destinations.service");
const admin_destinations_controller_1 = require("./admin-destinations.controller");
const destinations_controller_1 = require("./destinations.controller");
const scraper_module_1 = require("../scraper/scraper.module");
const destination_admin_service_1 = require("./destination-admin.service");
const destination_catalog_service_1 = require("./destination-catalog.service");
const destination_detail_service_1 = require("./destination-detail.service");
let DestinationsModule = class DestinationsModule {
};
exports.DestinationsModule = DestinationsModule;
exports.DestinationsModule = DestinationsModule = __decorate([
    (0, common_1.Module)({
        imports: [scraper_module_1.ScraperModule],
        controllers: [admin_destinations_controller_1.AdminDestinationsController, destinations_controller_1.DestinationsController],
        providers: [
            destinations_service_1.DestinationsService,
            destination_admin_service_1.DestinationAdminService,
            destination_catalog_service_1.DestinationCatalogService,
            destination_detail_service_1.DestinationDetailService,
        ],
        exports: [destinations_service_1.DestinationsService],
    })
], DestinationsModule);
//# sourceMappingURL=destinations.module.js.map