import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * RegisterDto — Data untuk registrasi user baru
 */
export class RegisterDto {
  @ApiProperty({ description: 'Nama lengkap user', example: 'John Doe' })
  @IsNotEmpty({ message: 'Nama tidak boleh kosong' })
  @IsString()
  @MinLength(2, { message: 'Nama minimal 2 karakter' })
  name: string;

  @ApiProperty({ description: 'Email user (unik)', example: 'john@mail.com' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email: string;

  @ApiProperty({ description: 'Password minimal 6 karakter', example: '123456' })
  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;
}
