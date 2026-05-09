import { ApiProperty } from '@nestjs/swagger';

/**
 * User data yang dikembalikan setelah login/register (tanpa password)
 */
export class AuthUserDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'john@mail.com' })
  email: string;

  @ApiProperty({ example: 'USER', enum: ['ADMIN', 'USER'] })
  role: string;
}

/**
 * Response dari endpoint login
 */
export class LoginResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  access_token: string;

  @ApiProperty({ description: 'JWT refresh token' })
  refresh_token: string;

  @ApiProperty({ description: 'Data user', type: AuthUserDto })
  user: AuthUserDto;
}

/**
 * Response dari endpoint register
 */
export class RegisterResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'john@mail.com' })
  email: string;

  @ApiProperty({ example: 'USER' })
  role: string;
}
