import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsUrl,
  IsIn,
  Matches,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DESTINATION_CATEGORY_VALUES } from '../destination-categories';

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

  @ApiPropertyOptional({
    description: 'Kategori destinasi',
    enum: DESTINATION_CATEGORY_VALUES,
    example: 'alam',
  })
  @IsOptional()
  @IsString()
  @IsIn(DESTINATION_CATEGORY_VALUES)
  category?: string;

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

  @ApiPropertyOptional({
    description:
      'Thumbnail URL. Mendukung URL penuh storage atau path legacy /uploads.',
    example:
      'https://project-ref.supabase.co/storage/v1/object/public/ranahinsight-images/destinations/2026-06-10/photo.jpg',
  })
  @ValidateIf(
    (_object, value) => value !== undefined && value !== null && value !== '',
  )
  @IsString()
  @Matches(/^(https?:\/\/|\/uploads\/)/i, {
    message: 'thumbnailUrl must be a full URL or legacy /uploads path',
  })
  thumbnailUrl?: string;

  @ApiPropertyOptional({
    description: 'Rating Google Maps (1.0 - 5.0)',
    example: 4.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  googleRating?: number;

  @ApiPropertyOptional({
    description: 'Jumlah ulasan di Google Maps',
    example: 1200,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  googleReviewCount?: number;
}
