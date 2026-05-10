import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SearchQueryDto {
  @ApiProperty({ description: 'Kata kunci pencarian tempat di Google Maps' })
  @IsString()
  @IsNotEmpty()
  q: string;
}
