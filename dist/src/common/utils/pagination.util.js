"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePaginationQuery = void 0;
const parsePaginationQuery = (page, limit, options = { defaultLimit: 20 }) => ({
    page: page ? parseInt(page, 10) : 1,
    limit: limit
        ? Math.min(parseInt(limit, 10), options.maxLimit ?? 100)
        : options.defaultLimit,
});
exports.parsePaginationQuery = parsePaginationQuery;
//# sourceMappingURL=pagination.util.js.map