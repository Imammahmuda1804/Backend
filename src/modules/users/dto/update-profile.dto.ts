import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Nama lengkap user',
    example: 'John Updated',
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Nama minimal 2 karakter' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Email user',
    example: 'newemail@mail.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Format email tidak valid' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Password baru',
    example: 'newpassword123',
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password?: string;

  @ApiPropertyOptional({
    description: 'URL foto profil user',
    example: '/uploads/profiles/user-123.jpg',
  })
  @IsOptional()
  @IsString()
  profilePicture?: string;
}
