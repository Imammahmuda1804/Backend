import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';

interface AuthenticatedUser {
  id: number;
  email: string;
  role: string;
}

type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

/**
 * Role-based Access Control Guard
 * Membatasi akses berdasarkan role user (ADMIN, USER)
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Jika tidak ada @Roles() decorator, izinkan akses
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // Jika tidak ada user (public endpoint yang lolos JWT guard)
    if (!user) {
      return false;
    }

    return requiredRoles.includes(user.role);
  }
}
