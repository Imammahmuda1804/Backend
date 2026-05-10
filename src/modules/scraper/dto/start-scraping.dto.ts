import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsPositive,
  IsOptional,
  IsString,
  IsArray,
  IsBoolean,
  Min,
} from 'class-validator';

export class StartScrapingDto {
  @ApiProperty()
  @IsInt()
  @IsPositive()
  destination_id: number;

  @ApiPropertyOptional({ default: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  max_reviews?: number = 100;

  @ApiPropertyOptional({ description: 'Custom Google Maps URL. If provided, overrides the destination URL.' })
  @IsOptional()
  @IsString()
  maps_url?: string;

  @ApiPropertyOptional({ default: 'newest' })
  @IsOptional()
  @IsString()
  sort?: string = 'newest';

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  stars_filter?: number[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  has_text?: boolean = true;
}
