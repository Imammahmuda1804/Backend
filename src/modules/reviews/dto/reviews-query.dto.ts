import {
  IsOptional,
  IsNumber,
  IsString,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewsQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Filter by sentiment',
    enum: ['positive', 'negative', 'neutral'],
  })
  @IsOptional()
  @IsString()
  @IsEnum(['positive', 'negative', 'neutral'])
  sentiment?: string;

  @ApiPropertyOptional({ description: 'Filter by topic ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  topic_id?: number;

  @ApiPropertyOptional({
    description: 'Filter reviews from this date (ISO 8601)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional({
    description: 'Filter reviews until this date (ISO 8601)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  date_to?: string;

  @ApiPropertyOptional({
    description: 'Sort order based on review date',
    enum: ['newest', 'oldest'],
    default: 'newest',
  })
  @IsOptional()
  @IsEnum(['newest', 'oldest'])
  sort_by?: 'newest' | 'oldest';

  @ApiPropertyOptional({
    description: 'Filter by NLP processing status',
    enum: ['all', 'processed', 'unprocessed'],
    default: 'all',
  })
  @IsOptional()
  @IsEnum(['all', 'processed', 'unprocessed'])
  nlp_status?: 'all' | 'processed' | 'unprocessed';
}
