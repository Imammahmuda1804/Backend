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
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Email atau password salah');
    }

    // Memastikan akun masih aktif.
    if (user.status !== 'active') {
      throw new UnauthorizedException('Akun Anda telah dinonaktifkan');
    }
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau password salah');
    }
    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    this.logger.log(`User logged in: ${user.email}`);

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    };
  }

  // Memverifikasi Google ID token, membuat atau menghubungkan akun, lalu membuat JWT aplikasi.
  async loginWithGoogle(dto: GoogleLoginDto) {
    const payload = await this.verifyGoogleToken(dto.id_token);
    const googleId = payload.sub;
    const email = payload.email?.toLowerCase();

    if (!googleId || !email || payload.email_verified !== true) {
      throw new UnauthorizedException('Akun Google tidak valid');
    }

    const existingByGoogleId = await this.prisma.user.findUnique({
      where: { googleId },
    });

    const user =
      existingByGoogleId ??
      (await this.findOrCreateGoogleUser({
        googleId,
        email,
        name: payload.name || email.split('@')[0],
        picture: payload.picture,
      }));

    if (user.status !== 'active') {
      throw new UnauthorizedException('Akun Anda telah dinonaktifkan');
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    this.logger.log(`User logged in with Google: ${user.email}`);

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    };
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
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        dto.refresh_token,
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        },
      );
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.status !== 'active') {
        throw new UnauthorizedException('User tidak valid atau tidak aktif');
      }
      const tokens = await this.generateTokens({
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      return tokens;
    } catch {
      throw new UnauthorizedException(
        'Refresh token tidak valid atau sudah expired',
      );
    }
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
    if (audience.length === 0) {
      this.logger.error('Google login client ID belum dikonfigurasi');
      throw new UnauthorizedException('Login Google belum dikonfigurasi');
    }

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience,
      });
      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Token Google tidak valid');
      }
      return payload;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Google token verification failed: ${message}`);
      throw new UnauthorizedException('Token Google tidak valid');
    }
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

  private async findOrCreateGoogleUser(input: {
    googleId: string;
    email: string;
    name: string;
    picture?: string;
  }) {
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
}
