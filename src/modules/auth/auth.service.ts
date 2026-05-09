import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';
import { JwtPayload } from '../../common/interfaces';

/**
 * AuthService — Business logic untuk authentication
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register user baru
   *
   * 1. Cek email unik
   * 2. Hash password dengan bcrypt
   * 3. Create user di database
   * 4. Return user tanpa password
   */
  async register(dto: RegisterDto) {
    // Cek email sudah terdaftar
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    this.logger.log(`User registered: ${user.email}`);

    return user;
  }

  /**
   * Login user
   *
   * 1. Find user by email
   * 2. Validate password
   * 3. Generate access + refresh token
   * 4. Return tokens + user info
   */
  async login(dto: LoginDto) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    // Cek status aktif
    if (user.status !== 'active') {
      throw new UnauthorizedException('Akun Anda telah dinonaktifkan');
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau password salah');
    }

    // Generate tokens
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
      },
    };
  }

  /**
   * Generate access token dan refresh token
   */
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
}
