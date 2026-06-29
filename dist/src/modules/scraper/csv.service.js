"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsvService = void 0;
const common_1 = require("@nestjs/common");
const csv_value_util_1 = require("./csv-value.util");
let CsvService = class CsvService {
    generateCsv(data) {
        if (!data || data.length === 0)
            return '';
        const headers = Object.keys(data[0]);
        const rows = [
            this.createHeaderRow(headers),
            ...data.map((item) => this.createDataRow(item, headers)),
        ];
        return rows.join('\n');
    }
    createHeaderRow(headers) {
        return headers.join(',');
    }
    createDataRow(item, headers) {
        return headers.map((header) => (0, csv_value_util_1.escapeCsvValue)(item[header])).join(',');
    }
};
exports.CsvService = CsvService;
exports.CsvService = CsvService = __decorate([
    (0, common_1.Injectable)()
], CsvService);
//# sourceMappingURL=csv.service.js.map