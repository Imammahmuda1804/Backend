export declare class PaginationMeta {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}
export declare class PaginatedResponseDto<T> {
    data: T[];
    meta: PaginationMeta;
    constructor(data: T[], totalItems: number, page: number, limit: number);
}
