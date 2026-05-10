import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class HistoryQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by destination ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  destination_id?: number;
}
