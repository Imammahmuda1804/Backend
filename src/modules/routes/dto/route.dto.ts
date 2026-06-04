import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const ROUTE_VISIBILITIES = ['private', 'public', 'link_only'] as const;
export type RouteVisibility = (typeof ROUTE_VISIBILITIES)[number];

export class RouteStopInputDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  destinationId: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  stopOrder?: number;

  @ApiPropertyOptional({ example: 'Mulai pagi agar tidak terlalu ramai.' })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  note?: string;

  @ApiPropertyOptional({ example: 90 })
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(720)
  estimatedVisitMinutes?: number;
}

export class CreateRouteDto {
  @ApiProperty({ example: '1 Hari Bukittinggi' })
  @IsString()
  @MaxLength(120)
  title: string;

  @ApiPropertyOptional({
    example: 'Rute singkat untuk wisata budaya dan alam.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(800)
  description?: string;

  @ApiPropertyOptional({ enum: ROUTE_VISIBILITIES, default: 'private' })
  @IsOptional()
  @IsIn(ROUTE_VISIBILITIES)
  visibility?: RouteVisibility;

  @ApiPropertyOptional({ example: 'Bukittinggi' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  autoSort?: boolean;

  @ApiProperty({ type: [RouteStopInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(25)
  @ValidateNested({ each: true })
  @Type(() => RouteStopInputDto)
  stops: RouteStopInputDto[];
}

export class UpdateRouteDto extends CreateRouteDto {}

export class AutoSortRouteDto {
  @ApiProperty({ type: [RouteStopInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(25)
  @ValidateNested({ each: true })
  @Type(() => RouteStopInputDto)
  stops: RouteStopInputDto[];
}

export class PublishRouteDto {
  @ApiProperty({ enum: ['public', 'link_only', 'private'] })
  @IsIn(ROUTE_VISIBILITIES)
  visibility: RouteVisibility;
}

export const ROUTE_PROGRESS_STATUSES = ['pending', 'visited'] as const;
export type RouteProgressStatus = (typeof ROUTE_PROGRESS_STATUSES)[number];

export class UpdateRouteProgressDto {
  @ApiProperty({ enum: ROUTE_PROGRESS_STATUSES, example: 'visited' })
  @IsIn(ROUTE_PROGRESS_STATUSES)
  status: RouteProgressStatus;

  @ApiPropertyOptional({ example: 'Sudah dikunjungi pagi hari.' })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  note?: string;
}
