import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class AdminCreateUserDto {
  @ApiProperty({ description: 'Nama lengkap user', example: 'John Doe' })
  @IsNotEmpty({ message: 'Nama tidak boleh kosong' })
  @IsString()
  @MinLength(2, { message: 'Nama minimal 2 karakter' })
  name: string;

  @ApiProperty({ description: 'Email user', example: 'john@mail.com' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email: string;

  @ApiProperty({ description: 'Password', example: 'password123' })
  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;

  @ApiProperty({ description: 'Role user', enum: Role, example: 'ADMIN' })
  @IsNotEmpty({ message: 'Role tidak boleh kosong' })
  @IsEnum(Role, { message: 'Role harus ADMIN atau USER' })
  role: Role;

  @ApiProperty({ description: 'Status user', enum: ['active', 'suspended'], example: 'active' })
  @IsNotEmpty({ message: 'Status tidak boleh kosong' })
  @IsIn(['active', 'suspended'], { message: 'Status harus active atau suspended' })
  status: string;
}
