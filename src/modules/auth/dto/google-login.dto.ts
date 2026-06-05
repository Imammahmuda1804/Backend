import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Token identitas Google yang dikirim client untuk ditukar dengan JWT aplikasi.
export class GoogleLoginDto {
  @ApiProperty({ description: 'Google ID token dari web atau mobile client' })
  @IsNotEmpty({ message: 'Google ID token tidak boleh kosong' })
  @IsString()
  id_token: string;
}
