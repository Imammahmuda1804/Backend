import { ApiProperty } from '@nestjs/swagger';

export class DestinationListDto {
  @ApiProperty({ description: 'ID destinasi', example: 1 })
  id: number;

  @ApiProperty({ description: 'Nama destinasi', example: 'Jam Gadang' })
  name: string;

  @ApiProperty({ description: 'URL-friendly slug', example: 'jam-gadang' })
  slug: string;

  @ApiProperty({ description: 'Kota lokasi destinasi', example: 'Bukittinggi' })
  city: string;

  @ApiProperty({
    description: 'Provinsi lokasi destinasi',
    example: 'Sumatera Barat',
  })
  province: string;

  @ApiProperty({
    description: 'URL thumbnail image',
    nullable: true,
    example: 'https://example.com/image.jpg',
  })
  thumbnailUrl: string | null;

  @ApiProperty({
    description: 'Rating dari Google Maps (1-5)',
    nullable: true,
    example: 4.5,
  })
  googleRating: number | null;

  @ApiProperty({
    description: 'Rating dari user aplikasi (1-5)',
    nullable: true,
    example: 4.2,
  })
  userRating: number | null;

  @ApiProperty({
    description: 'Rasio review positif (0-1)',
    nullable: true,
    example: 0.85,
  })
  positiveRatio: number | null;

  @ApiProperty({
    description: 'Skor rekomendasi (0-100)',
    nullable: true,
    example: 87.5,
  })
  recommendationScore: number | null;
}
