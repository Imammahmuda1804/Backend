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
let CsvService = class CsvService {
    generateCsv(data) {
        if (!data || data.length === 0)
            return '';
        const headers = Object.keys(data[0]);
        const rows = [headers.join(',')];
        for (const item of data) {
            const values = headers.map((header) => {
                const val = item[header];
                const stringVal = val === null || val === undefined
                    ? ''
                    : typeof val === 'object'
                        ? JSON.stringify(val)
                        : String(val);
                return `"${stringVal.replace(/"/g, '""')}"`;
            });
            rows.push(values.join(','));
        }
        return rows.join('\n');
    }
    generateInternalCsv(data) {
        return this.generateCsv(data);
    }
};
exports.CsvService = CsvService;
exports.CsvService = CsvService = __decorate([
    (0, common_1.Injectable)()
], CsvService);
//# sourceMappingURL=csv.service.js.map