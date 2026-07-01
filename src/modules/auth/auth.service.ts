import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto, RefreshTokenDto, GoogleLoginDto } from './dto';
import { JwtPayload } from '../../common/interfaces';

type AuthenticatedUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  profilePicture: string | null;
};

type GoogleProfile = {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
};

type LoginCandidate = AuthenticatedUser & {
  password: string | null;
  status: string;
};

type PasswordLoginCandidate = AuthenticatedUser & {
  password: string;
  status: string;
};

// Mengelola registrasi, login, token, dan logout.
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly googleClient = new OAuth2Client();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // Mendaftarkan user baru setelah email divalidasi.
  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        profilePicture: dto.profilePicture,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profilePicture: true,
        createdAt: true,
      },
    });

    this.logger.log(`User registered: ${user.email}`);

    return user;
  }

  // Memvalidasi kredensial dan membuat token.
  async login(dto: LoginDto) {
    const user = await this.findPasswordLoginCandidate(dto.email);
    this.assertPasswordLoginAllowed(user);
    await this.assertPasswordMatches(dto.password, user.password);

    this.logger.log(`User logged in: ${user.email}`);

    return this.buildLoginResponse(user);
  }

  private findPasswordLoginCandidate(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  private assertPasswordLoginAllowed(
    user: LoginCandidate | null,
  ): asserts user is PasswordLoginCandidate {
    if (!user?.password) this.throwInvalidPasswordLogin();
    this.assertActiveUser(user.status);
  }

  private async assertPasswordMatches(
    plainPassword: string,
    hashedPassword: string,
  ) {
    const isPasswordValid = await bcrypt.compare(plainPassword, hashedPassword);
    if (!isPasswordValid) this.throwInvalidPasswordLogin();
  }

  private throwInvalidPasswordLogin(): never {
    throw new UnauthorizedException('Email atau password salah');
  }

  // Memverifikasi Google ID token, membuat atau menghubungkan akun, lalu membuat JWT aplikasi.
  async loginWithGoogle(dto: GoogleLoginDto) {
    const payload = await this.verifyGoogleToken(dto.id_token);
    const googleProfile = this.toVerifiedGoogleProfile(payload);
    const existingByGoogleId = await this.findUserByGoogleId(
      googleProfile.googleId,
    );

    const user =
      existingByGoogleId ?? (await this.findOrCreateGoogleUser(googleProfile));

    this.assertActiveUser(user.status);

    this.logger.log(`User logged in with Google: ${user.email}`);

    return this.buildLoginResponse(user);
  }

  private toVerifiedGoogleProfile(payload: TokenPayload): GoogleProfile {
    this.assertGooglePayloadVerified(payload);
    const email = payload.email.toLowerCase();

    return {
      googleId: payload.sub,
      email,
      name: this.resolveGoogleProfileName(payload, email),
      picture: payload.picture,
    };
  }

  private assertGooglePayloadVerified(
    payload: TokenPayload,
  ): asserts payload is TokenPayload & { sub: string; email: string } {
    if (!payload.sub) this.throwInvalidGoogleAccount();
    if (!payload.email) this.throwInvalidGoogleAccount();
    if (payload.email_verified !== true) this.throwInvalidGoogleAccount();
  }

  private resolveGoogleProfileName(payload: TokenPayload, email: string) {
    return payload.name ?? email.split('@')[0];
  }

  private throwInvalidGoogleAccount(): never {
    throw new UnauthorizedException('Akun Google tidak valid');
  }

  private assertActiveUser(status: string) {
    if (status !== 'active') {
      throw new UnauthorizedException('Akun Anda telah dinonaktifkan');
    }
  }

  private findUserByGoogleId(googleId: string) {
    return this.prisma.user.findUnique({ where: { googleId } });
  }

  // Membuat access token dan refresh token.
  async generateTokens(payload: JwtPayload) {
    const tokenPayload = {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(tokenPayload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRATION') || '15m',
      }),
      this.jwtService.signAsync(tokenPayload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION') || '7d',
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  // Memperbarui token dari refresh token valid.
  async refreshToken(dto: RefreshTokenDto) {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(
        dto.refresh_token,
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        },
      );
    } catch {
      throw new UnauthorizedException(
        'Refresh token tidak valid atau sudah expired',
      );
    }

    let user: { id: number; name: string; email: string; role: string; status: string; profilePicture: string | null } | null;
    try {
      user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, name: true, email: true, role: true, status: true, profilePicture: true },
      });
    } catch (dbError) {
      this.logger.error(`Database error during refresh: ${dbError}`);
      throw new UnauthorizedException(
        'Gagal memverifikasi token. Silakan coba lagi.',
      );
    }

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('User tidak valid atau tidak aktif');
    }
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return { ...tokens, user: this.toPublicAuthUser(user) };
  }

  // Memvalidasi refresh token saat logout.
  async logout(dto: RefreshTokenDto) {
    try {
      await this.jwtService.verifyAsync(dto.refresh_token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      // Token blacklist dapat ditambahkan lewat Redis.

      return { message: 'Logged out successfully' };
    } catch {
      throw new UnauthorizedException('Refresh token tidak valid');
    }
  }

  private async verifyGoogleToken(idToken: string): Promise<TokenPayload> {
    const audience = this.getGoogleClientIds();
    this.assertGoogleLoginConfigured(audience);

    try {
      return await this.readGoogleTokenPayload(idToken, audience);
    } catch (error) {
      return this.rejectInvalidGoogleToken(error);
    }
  }

  private assertGoogleLoginConfigured(audience: string[]) {
    if (audience.length > 0) return;

    this.logger.error('Google login client ID belum dikonfigurasi');
    throw new UnauthorizedException('Login Google belum dikonfigurasi');
  }

  private async readGoogleTokenPayload(idToken: string, audience: string[]) {
    const ticket = await this.googleClient.verifyIdToken({ idToken, audience });
    const payload = ticket.getPayload();
    if (!payload) throw new UnauthorizedException('Token Google tidak valid');
    return payload;
  }

  private rejectInvalidGoogleToken(error: unknown): never {
    const message = error instanceof Error ? error.message : String(error);
    this.logger.warn(`Google token verification failed: ${message}`);
    throw new UnauthorizedException('Token Google tidak valid');
  }

  private getGoogleClientIds(): string[] {
    const clientIds = this.configService.get<string>('GOOGLE_CLIENT_IDS');
    const webClientId = this.configService.get<string>('GOOGLE_WEB_CLIENT_ID');

    return [
      ...(clientIds?.split(',') ?? []),
      ...(webClientId ? [webClientId] : []),
    ]
      .map((clientId) => clientId.trim())
      .filter(Boolean);
  }

  private async findOrCreateGoogleUser(input: GoogleProfile) {
    const existingByEmail = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: input.email,
          mode: 'insensitive',
        },
      },
    });

    if (existingByEmail) {
      return this.prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          googleId: input.googleId,
          authProvider:
            existingByEmail.authProvider === 'local'
              ? 'local_google'
              : existingByEmail.authProvider,
          emailVerified: true,
          profilePicture: existingByEmail.profilePicture ?? input.picture,
        },
      });
    }

    return this.prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: null,
        googleId: input.googleId,
        authProvider: 'google',
        emailVerified: true,
        profilePicture: input.picture,
      },
    });
  }

  private async buildLoginResponse(user: AuthenticatedUser) {
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      ...tokens,
      user: this.toPublicAuthUser(user),
    };
  }

  private toPublicAuthUser(user: AuthenticatedUser) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
    };
  }
}
