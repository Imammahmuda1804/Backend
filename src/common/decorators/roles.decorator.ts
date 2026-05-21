import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

// Menandai role yang boleh mengakses endpoint.
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
