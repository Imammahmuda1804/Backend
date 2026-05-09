"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateOffset = calculateOffset;
exports.calculateTotalPages = calculateTotalPages;
exports.buildOrderBy = buildOrderBy;
const pagination_constant_1 = require("../constants/pagination.constant");
function calculateOffset(page, limit) {
    return (page - 1) * limit;
}
function calculateTotalPages(totalItems, limit) {
    return Math.ceil(totalItems / limit);
}
function buildOrderBy(sort, order) {
    const sortField = sort || 'createdAt';
    const sortOrder = order || pagination_constant_1.PAGINATION.DEFAULT_ORDER;
    return { [sortField]: sortOrder };
}
//# sourceMappingURL=pagination.util.js.map