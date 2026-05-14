"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NlpModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const nlp_service_1 = require("./nlp.service");
const nlp_result_storage_service_1 = require("./nlp-result-storage.service");
const vector_module_1 = require("../vector/vector.module");
const ai_naming_service_1 = require("./ai-naming.service");
const nlp_controller_1 = require("./nlp.controller");
const csv_service_1 = require("../scraper/csv.service");
let NlpModule = class NlpModule {
};
exports.NlpModule = NlpModule;
exports.NlpModule = NlpModule = __decorate([
    (0, common_1.Module)({
        imports: [axios_1.HttpModule, vector_module_1.VectorModule],
        controllers: [nlp_controller_1.NlpController],
        providers: [nlp_service_1.NlpService, nlp_result_storage_service_1.NlpResultStorageService, ai_naming_service_1.AiNamingService, csv_service_1.CsvService],
        exports: [nlp_service_1.NlpService, nlp_result_storage_service_1.NlpResultStorageService, ai_naming_service_1.AiNamingService],
    })
], NlpModule);
//# sourceMappingURL=nlp.module.js.map