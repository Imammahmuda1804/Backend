import { PAGINATION } from '../constants/pagination.constant';

// Menghitung offset pagination untuk Prisma.
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

// Menghitung total halaman pagination.
export function calculateTotalPages(totalItems: number, limit: number): number {
  return Math.ceil(totalItems / limit);
}

// Membuat orderBy Prisma dari parameter sort.
export function buildOrderBy(
  sort?: string,
  order?: 'asc' | 'desc',
): Record<string, 'asc' | 'desc'> {
  const sortField = sort || 'createdAt';
  const sortOrder = order || PAGINATION.DEFAULT_ORDER;

  return { [sortField]: sortOrder };
}
