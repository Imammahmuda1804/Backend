import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserIdentityFieldsDto } from './user-identity-fields.dto';

export class UpdateProfileDto extends UserIdentityFieldsDto {
  @ApiPropertyOptional({
    description: 'URL foto profil user',
    example:
      'https://project-ref.supabase.co/storage/v1/object/public/ranahinsight-images/profiles/2026-06-10/avatar.jpg',
  })
  @IsOptional()
  @IsString()
  profilePicture?: string;
}
