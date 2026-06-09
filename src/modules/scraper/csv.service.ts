import { Injectable } from '@nestjs/common';
import { escapeCsvValue } from './csv-value.util';

@Injectable()
export class CsvService {
  generateCsv(data: Record<string, unknown>[]): string {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = [
      this.createHeaderRow(headers),
      ...data.map((item) => this.createDataRow(item, headers)),
    ];

    return rows.join('\n');
  }

  generateInternalCsv(data: Record<string, unknown>[]): string {
    return this.generateCsv(data);
  }

  private createHeaderRow(headers: string[]): string {
    return headers.join(',');
  }

  private createDataRow(
    item: Record<string, unknown>,
    headers: string[],
  ): string {
    return headers.map((header) => escapeCsvValue(item[header])).join(',');
  }
}
