import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

interface AuthenticatedUser {
  id: number;
  email: string;
  role: string;
}

type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

/**
 * @CurrentUser() decorator
 * Ambil user dari JWT payload yang sudah di-decode oleh passport
 *
 * Usage:
 *   @Get('me')
 *   getProfile(@CurrentUser() user: JwtPayload) { ... }
 *
 *   @Get('me')
 *   getProfile(@CurrentUser('sub') userId: number) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    // Jika data diberikan, return property spesifik (e.g., 'sub', 'email')
    return data ? user?.[data] : user;
  },
);
