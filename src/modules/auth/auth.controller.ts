import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RegisterResponseDto, LoginResponseDto } from './dto';
import { Public } from '../../common/decorators/public.decorator';

/**
 * AuthController — Endpoint untuk authentication
 * Semua endpoint di controller ini bersifat @Public()
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/register
   * Mendaftarkan user baru
   */
  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register user baru' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User berhasil didaftarkan',
    type: RegisterResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validasi gagal' })
  @ApiResponse({ status: 409, description: 'Email sudah terdaftar' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * POST /api/auth/login
   * Login dan mendapatkan JWT token
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login berhasil',
    type: LoginResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Email atau password salah' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
