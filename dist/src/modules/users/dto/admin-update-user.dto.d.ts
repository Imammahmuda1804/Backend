import { Role } from '@prisma/client';
import { UserIdentityFieldsDto } from './user-identity-fields.dto';
export declare class AdminUpdateUserDto extends UserIdentityFieldsDto {
    role?: Role;
    status?: string;
}
