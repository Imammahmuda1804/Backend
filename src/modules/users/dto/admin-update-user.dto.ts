import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  IsIn,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class AdminUpdateUserDto {
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
    example: 'john@mail.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Format email tidak valid' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Role user',
    enum: Role,
    example: 'ADMIN',
  })
  @IsOptional()
  @IsEnum(Role, { message: 'Role harus ADMIN atau USER' })
  role?: Role;

  @ApiPropertyOptional({
    description: 'Status user',
    enum: ['active', 'suspended'],
    example: 'suspended',
  })
  @IsOptional()
  @IsIn(['active', 'suspended'], {
    message: 'Status harus active atau suspended',
  })
  status?: string;
}
