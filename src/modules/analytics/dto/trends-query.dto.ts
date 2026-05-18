import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class TrendsQueryDto {
  @ApiPropertyOptional({
    description: 'Periode trend: daily, weekly, atau monthly',
    enum: ['daily', 'weekly', 'monthly'],
    default: 'monthly',
  })
  @IsOptional()
  @IsIn(['daily', 'weekly', 'monthly'])
  period?: 'daily' | 'weekly' | 'monthly' = 'monthly';
}
