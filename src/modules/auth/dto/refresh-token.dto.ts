import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token yang valid',
    example: 'eyJhbG...',
  })
  @IsNotEmpty({ message: 'Refresh token tidak boleh kosong' })
  @IsString()
  refresh_token: string;
}
