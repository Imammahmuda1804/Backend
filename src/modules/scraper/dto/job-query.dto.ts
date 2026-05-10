import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class JobQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Filter by job status (e.g. pending, running, completed, failed)',
  })
  @IsOptional()
  @IsString()
  status?: string;
}
