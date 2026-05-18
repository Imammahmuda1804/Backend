import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CompareQueryDto {
  @ApiProperty({ description: 'ID destinasi pertama', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  destination1: number;

  @ApiProperty({ description: 'ID destinasi kedua', example: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  destination2: number;
}
