type PaginationOptions = {
    defaultLimit: number;
    maxLimit?: number;
};
export declare const parsePaginationQuery: (page?: string, limit?: string, options?: PaginationOptions) => {
    page: number;
    limit: number;
};
export {};
