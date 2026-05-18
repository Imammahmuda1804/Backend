import { Injectable } from '@nestjs/common';

function serializeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return JSON.stringify(value) ?? '';
  return '';
}

@Injectable()
export class CsvService {
  generateCsv(data: Record<string, unknown>[]): string {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = [headers.join(',')];

    for (const item of data) {
      const values = headers.map((header) => {
        const val = item[header];
        const stringVal = serializeCsvValue(val);
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
