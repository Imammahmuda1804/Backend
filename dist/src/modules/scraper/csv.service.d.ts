export declare class CsvService {
    generateCsv(data: Record<string, unknown>[]): string;
    private createHeaderRow;
    private createDataRow;
}
