import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

interface AuthenticatedUser {
  id: number;
  email: string;
  role: string;
}

/**
 * OptionalJwtAuthGuard
 *
 * Berbeda dengan JwtAuthGuard biasa:
 * - Jika token ada dan valid → req.user di-populate
 * - Jika token tidak ada atau tidak valid → req.user = undefined, request tetap lanjut (tidak 401)
 *
 * Digunakan untuk endpoint yang bisa diakses guest maupun user login,
 * tapi ingin memanfaatkan info user jika tersedia (e.g. simpan search history).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Coba jalankan passport JWT, tapi jangan throw jika token tidak ada/invalid
    try {
      return (await super.canActivate(context)) as boolean;
    } catch {
      // Token tidak ada, expired, atau malformed → lanjut sebagai guest
      return true;
    }
  }

  // Override handleRequest: jangan throw error jika tidak ada user
  handleRequest<TUser = AuthenticatedUser | undefined>(
    _err: Error | null,
    user: TUser | false | null,
  ): TUser {
    // Kembalikan user jika ada, undefined jika tidak — tidak throw
    return (user || undefined) as TUser;
  }
}
