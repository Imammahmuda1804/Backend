import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsInt,
  IsIn,
  IsArray,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DESTINATION_CATEGORY_VALUES } from '../../destinations/destination-categories';

function emptyStringToUndefined(value: unknown): unknown {
  return value === '' ? undefined : value;
}

function parseNumberArray(value: unknown): number[] | undefined {
  if (value == null || value === '') return undefined;
  const parsed = toRawNumberValues(value)
    .map((item) => Number(item))
    .filter(isPositiveInteger);
  return parsed.length > 0 ? parsed : undefined;
}

function toRawNumberValues(value: unknown): unknown[] {
  if (Array.isArray(value)) return value as unknown[];
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value).split(',');
  }
  return [];
}

function isPositiveInteger(value: number) {
  return Number.isInteger(value) && value > 0;
}

export class SearchQueryDto {
  @ApiProperty({
    description: 'Query pencarian destinasi wisata',
    example: 'wisata keluarga murah di bukittinggi',
    minLength: 3,
    maxLength: 500,
  })
  @IsString()
  @MinLength(3, { message: 'Query minimal 3 karakter' })
  @MaxLength(500, { message: 'Query maksimal 500 karakter' })
  query: string;

  @ApiPropertyOptional({
    description: 'Jumlah hasil maksimal (default: 10, max: 50)',
    default: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiPropertyOptional({
    description:
      'Mode urutan pencarian semantik (relevance = murni kemiripan teks, hybrid = rekomendasi + rating + sentimen)',
    enum: ['relevance', 'hybrid'],
    default: 'hybrid',
  })
  @IsOptional()
  @IsString()
  sort?: 'relevance' | 'hybrid' = 'hybrid';

  @ApiPropertyOptional({
    description: 'Filter kota destinasi',
    example: 'Bukittinggi',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Filter kategori destinasi',
    enum: DESTINATION_CATEGORY_VALUES,
    example: 'alam',
  })
  @IsOptional()
  @Transform(({ value }) => emptyStringToUndefined(value))
  @IsString()
  @IsIn(DESTINATION_CATEGORY_VALUES)
  category?: string;

  @ApiPropertyOptional({
    description: 'Filter ID topik, bisa array atau comma-separated',
    example: '1,2,3',
  })
  @IsOptional()
  @Transform(({ value }) => parseNumberArray(value))
  @IsArray()
  @IsInt({ each: true })
  topic_ids?: number[];

  @ApiPropertyOptional({
    description: 'Alias camelCase untuk topic_ids',
    example: [1, 2, 3],
  })
  @IsOptional()
  @Transform(({ value }) => parseNumberArray(value))
  @IsArray()
  @IsInt({ each: true })
  topicIds?: number[];

  @ApiPropertyOptional({
    description: 'Rating minimal destinasi',
    example: 4,
    minimum: 0,
    maximum: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  min_rating?: number;

  @ApiPropertyOptional({
    description: 'Alias camelCase untuk min_rating',
    example: 4,
    minimum: 0,
    maximum: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({
    description: 'Filter sentimen dominan/review',
    enum: ['positive', 'negative', 'neutral'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['positive', 'negative', 'neutral'])
  sentiment?: 'positive' | 'negative' | 'neutral';
}
