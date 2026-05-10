import { Role } from '@prisma/client';
export declare class AdminUpdateUserDto {
    name?: string;
    email?: string;
    role?: Role;
    status?: string;
}
