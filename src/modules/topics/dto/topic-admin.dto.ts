import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
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
