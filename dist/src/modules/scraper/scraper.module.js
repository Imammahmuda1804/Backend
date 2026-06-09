"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScraperModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const scraper_service_1 = require("./scraper.service");
const scraper_controller_1 = require("./scraper.controller");
const apify_service_1 = require("./apify.service");
const scraper_processor_1 = require("./scraper.processor");
const axios_1 = require("@nestjs/axios");
const csv_service_1 = require("./csv.service");
const scraper_workbook_service_1 = require("./scraper-workbook.service");
let ScraperModule = class ScraperModule {
};
exports.ScraperModule = ScraperModule;
exports.ScraperModule = ScraperModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bullmq_1.BullModule.registerQueue({
                name: 'scraping-queue',
            }),
            axios_1.HttpModule,
        ],
        controllers: [scraper_controller_1.ScraperController],
        providers: [
            scraper_service_1.ScraperService,
            apify_service_1.ApifyService,
            scraper_processor_1.ScraperProcessor,
            scraper_workbook_service_1.ScraperWorkbookService,
            csv_service_1.CsvService,
        ],
        exports: [scraper_service_1.ScraperService],
    })
], ScraperModule);
//# sourceMappingURL=scraper.module.js.map