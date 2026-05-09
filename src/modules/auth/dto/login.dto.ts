import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * LoginDto — Data untuk login
 */
export class LoginDto {
  @ApiProperty({ description: 'Email user', example: 'john@mail.com' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email: string;

  @ApiProperty({ description: 'Password', example: '123456' })
  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @IsString()
  password: string;
}
