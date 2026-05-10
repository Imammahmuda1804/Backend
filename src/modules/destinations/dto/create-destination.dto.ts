import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDestinationDto {
  @ApiProperty({ description: 'Nama destinasi', example: 'Jam Gadang' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Deskripsi', example: 'Ikon wisata...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Kota', example: 'Bukittinggi' })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({ description: 'Provinsi', example: 'Sumatera Barat' })
  @IsNotEmpty()
  @IsString()
  province: string;

  @ApiPropertyOptional({ description: 'Latitude', example: -0.305 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude', example: 100.369 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Google Maps URL',
    example: 'https://maps.google.com/...',
  })
  @IsOptional()
  @IsUrl()
  googleMapsUrl?: string;

  @ApiPropertyOptional({
    description: 'YouTube Video URL',
    example: 'https://youtube.com/...',
  })
  @IsOptional()
  @IsUrl()
  youtubeUrl?: string;

  @ApiPropertyOptional({
    description: 'Google Place ID',
    example: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
  })
  @IsOptional()
  @IsString()
  googlePlaceId?: string;

  @ApiPropertyOptional({ description: 'Thumbnail URL', example: 'https://...' })
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;
}
