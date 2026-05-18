import { ApiProperty } from '@nestjs/swagger';
import { DestinationListDto } from './destination-list.dto';

export class DestinationDetailDto extends DestinationListDto {
  @ApiProperty({
    description: 'Deskripsi lengkap destinasi',
    nullable: true,
    example: 'Jam Gadang adalah menara jam ikonik di Bukittinggi',
  })
  description: string | null;

  @ApiProperty({
    description: 'Latitude koordinat',
    nullable: true,
    example: -0.3055,
  })
  latitude: number | null;

  @ApiProperty({
    description: 'Longitude koordinat',
    nullable: true,
    example: 100.3693,
  })
  longitude: number | null;

  @ApiProperty({
    description: 'URL Google Maps',
    nullable: true,
    example: 'https://maps.google.com/?cid=123',
  })
  googleMapsUrl: string | null;

  @ApiProperty({
    description: 'URL video YouTube',
    nullable: true,
    example: 'https://youtube.com/watch?v=abc',
  })
  youtubeUrl: string | null;

  @ApiProperty({
    description: 'Gallery images',
    type: 'array',
    items: { type: 'object' },
  })
  images: any[];

  @ApiProperty({
    description: 'Topics terkait destinasi',
    type: 'array',
    items: { type: 'object' },
  })
  topics: any[];

  @ApiProperty({
    description: 'Trend sentimen dari waktu ke waktu',
    type: 'array',
    items: { type: 'object' },
  })
  sentimentTrends: any[];
}
