import { PAGINATION } from '../constants/pagination.constant';

/**
 * Hitung offset untuk Prisma skip berdasarkan page dan limit
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Hitung total halaman
 */
export function calculateTotalPages(totalItems: number, limit: number): number {
  return Math.ceil(totalItems / limit);
}

/**
 * Build Prisma orderBy object dari sort dan order string
 *
 * @example
 * buildOrderBy('createdAt', 'desc') => { createdAt: 'desc' }
 * buildOrderBy(undefined, undefined) => { createdAt: 'desc' }
 */
export function buildOrderBy(
  sort?: string,
  order?: 'asc' | 'desc',
): Record<string, 'asc' | 'desc'> {
  const sortField = sort || 'createdAt';
  const sortOrder = order || PAGINATION.DEFAULT_ORDER;

  return { [sortField]: sortOrder };
}
