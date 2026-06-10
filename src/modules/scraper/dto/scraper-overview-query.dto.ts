import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

export class ScraperOverviewQueryDto {
  @ApiProperty({ description: 'ID destinasi yang akan dicek' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  destination_id: number;

  @ApiPropertyOptional({
    description:
      'URL Google Maps kustom. Jika kosong, sistem memakai URL Google Maps pada data destinasi.',
  })
  @IsOptional()
  @IsString()
  maps_url?: string;
}
