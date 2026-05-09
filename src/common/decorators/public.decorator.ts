import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * @Public() decorator
 * Tandai endpoint agar bypass JWT authentication guard
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
