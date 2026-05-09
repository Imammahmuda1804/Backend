/**
 * Role constants
 * Sesuai dengan enum Role di Prisma schema
 */
export const ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;

export type RoleType = (typeof ROLES)[keyof typeof ROLES];
