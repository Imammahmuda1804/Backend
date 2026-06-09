import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserIdentityFieldsDto } from './user-identity-fields.dto';

export class UpdateProfileDto extends UserIdentityFieldsDto {
  @ApiPropertyOptional({
    description: 'URL foto profil user',
    example: '/uploads/profiles/user-123.jpg',
  })
  @IsOptional()
  @IsString()
  profilePicture?: string;
}
