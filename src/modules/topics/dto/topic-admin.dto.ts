import { Type } from 'class-transformer';
import {
  IsBoolean,
  ArrayMinSize,
  ArrayUnique,
  IsInt,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RenameTopicDto {
  @ApiProperty({ example: 'Tiket mahal' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  topicName: string;
}

export class UpdateTopicSettingsDto {
  @ApiPropertyOptional({
    example: 1,
    nullable: true,
    description: 'ID topic group. Kirim null untuk melepas group.',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  groupId?: number | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isSearchVisible?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isDetailVisible?: boolean;
}

export class RenameTopicGroupDto {
  @ApiProperty({ example: 'Harga & Pengalaman' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  groupName: string;
}

export class TopicGroupPayloadDto {
  @ApiProperty({ example: 'Akses & Transportasi' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  groupName: string;

  @ApiPropertyOptional({
    example:
      'Keluhan dan sinyal terkait akses lokasi, parkir, dan transportasi.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  description?: string;

  @ApiPropertyOptional({
    example: ['akses', 'parkir', 'jalan'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

export class MergeTopicsDto {
  @ApiProperty({
    example: 12,
    description: 'Topic tujuan yang akan dipertahankan.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  targetTopicId: number;

  @ApiProperty({
    example: [21, 34],
    description: 'Daftar topic sumber yang akan digabung ke target.',
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  sourceTopicIds: number[];
}
