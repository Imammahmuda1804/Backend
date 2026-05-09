export declare function calculateOffset(page: number, limit: number): number;
export declare function calculateTotalPages(totalItems: number, limit: number): number;
export declare function buildOrderBy(sort?: string, order?: 'asc' | 'desc'): Record<string, 'asc' | 'desc'>;
