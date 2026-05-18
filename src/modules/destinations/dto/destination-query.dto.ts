import { IsOptional, IsInt, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

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
}
