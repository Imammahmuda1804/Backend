import { IsOptional, IsInt, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { DESTINATION_CATEGORY_VALUES } from '../destination-categories';

function emptyStringToUndefined(value: unknown): unknown {
  return value === '' ? undefined : value;
}

export class DestinationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter berdasarkan ID topik (single)',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  topic_id?: number;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan beberapa ID topik (comma-separated)',
    example: '1,2,3',
  })
  @IsOptional()
  @IsString()
  topic_ids?: string;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan kota',
    example: 'Bukittinggi',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Filter berdasarkan kategori destinasi',
    enum: DESTINATION_CATEGORY_VALUES,
    example: 'alam',
  })
  @IsOptional()
  @Type(() => String)
  @Transform(({ value }) => emptyStringToUndefined(value))
  @IsString()
  category?: string;
}
