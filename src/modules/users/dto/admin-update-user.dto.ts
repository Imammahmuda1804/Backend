import { IsEnum, IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { UserIdentityFieldsDto } from './user-identity-fields.dto';

export class AdminUpdateUserDto extends UserIdentityFieldsDto {
  @ApiPropertyOptional({
    description: 'Role user',
    enum: Role,
    example: 'ADMIN',
  })
  @IsOptional()
  @IsEnum(Role, { message: 'Role harus ADMIN atau USER' })
  role?: Role;

  @ApiPropertyOptional({
    description: 'Status user',
    enum: ['active', 'suspended'],
    example: 'suspended',
  })
  @IsOptional()
  @IsIn(['active', 'suspended'], {
    message: 'Status harus active atau suspended',
  })
  status?: string;
}
