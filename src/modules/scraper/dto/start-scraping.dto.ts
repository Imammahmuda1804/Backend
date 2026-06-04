import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsPositive,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class StartScrapingDto {
  @ApiProperty({ description: 'ID destinasi yang akan di-scraping' })
  @IsInt()
  @IsPositive()
  destination_id: number;

  @ApiPropertyOptional({
    description:
      'Jumlah maksimal ulasan yang diambil (default: 100). Kosongkan untuk ambil semua.',
    default: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  max_reviews?: number = 100;

  @ApiPropertyOptional({
    description:
      'Jika true, scraper akan mencoba mengambil seluruh ulasan berteks dan mengabaikan max_reviews.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  fetch_all_reviews?: boolean = false;

  @ApiPropertyOptional({
    description:
      'URL Google Maps kustom. Jika diisi, akan menggantikan URL yang tersimpan di data destinasi.',
  })
  @IsOptional()
  @IsString()
  maps_url?: string;
}
