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

// Mengambil user aktif dari payload JWT.
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    // Jika data diberikan, return property spesifik (e.g., 'sub', 'email')
    return data ? user?.[data] : user;
  },
);
