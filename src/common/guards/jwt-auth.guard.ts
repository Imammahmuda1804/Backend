import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

interface AuthenticatedUser {
  id: number;
  email: string;
  role: string;
}

// Guard JWT global untuk endpoint privat.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Lewati endpoint publik.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = AuthenticatedUser>(
    err: Error | null,
    user: TUser | false | null,
  ): TUser {
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException(
          'Token tidak valid atau sudah kadaluarsa. Silakan login kembali.',
        )
      );
    }
    return user;
  }
}
