type PaginationOptions = {
  defaultLimit: number;
  maxLimit?: number;
};

export const parsePaginationQuery = (
  page?: string,
  limit?: string,
  options: PaginationOptions = { defaultLimit: 20 },
) => ({
  page: page ? parseInt(page, 10) : 1,
  limit: limit
    ? Math.min(parseInt(limit, 10), options.maxLimit ?? 100)
    : options.defaultLimit,
});
