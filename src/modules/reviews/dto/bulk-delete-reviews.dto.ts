import { IsNotEmpty, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class BulkDeleteReviewsDto {
  @ApiProperty({ description: 'ID Destinasi', example: 1 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  destinationId: number;

  @ApiProperty({
    description: 'Kategori penghapusan',
    enum: ['all', 'processed', 'unprocessed'],
    example: 'unprocessed',
  })
  @IsNotEmpty()
  @IsEnum(['all', 'processed', 'unprocessed'])
  category: 'all' | 'processed' | 'unprocessed';
}
