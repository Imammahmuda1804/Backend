import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  LoginDto,
  LoginResponseDto,
  RefreshTokenDto,
  RegisterDto,
  RegisterResponseDto,
} from './dto';
import { Public } from '../../common/decorators/public.decorator';

// Mengelola autentikasi user.
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Registrasi user baru.
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register user baru' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Registrasi berhasil',
    type: RegisterResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email sudah terdaftar' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // Login user dan menerbitkan token.
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

  // Memperbarui access token.
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, description: 'Token berhasil diperbarui' })
  @ApiResponse({ status: 401, description: 'Refresh token invalid' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  // Logout user memakai refresh token.
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, description: 'Logout berhasil' })
  @ApiResponse({
    status: 401,
    description: 'Refresh token invalid atau tidak ada token access',
  })
  async logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto);
  }
}
