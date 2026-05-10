import { Injectable } from '@nestjs/common';

@Injectable()
export class CsvService {
  generateCsv(data: Record<string, unknown>[]): string {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = [headers.join(',')];

    for (const item of data) {
      const values = headers.map((header) => {
        const val = item[header];
        const stringVal =
          val === null || val === undefined
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

  generateInternalCsv(data: Record<string, unknown>[]): string {
    return this.generateCsv(data);
  }
}
