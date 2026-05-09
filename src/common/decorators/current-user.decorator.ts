import { createParamDecorator, ExecutionContext } from '@nestjs/common';

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
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Jika data diberikan, return property spesifik (e.g., 'sub', 'email')
    return data ? user?.[data] : user;
  },
);
