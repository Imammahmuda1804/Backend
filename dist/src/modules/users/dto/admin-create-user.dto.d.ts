import { Role } from '@prisma/client';
export declare class AdminCreateUserDto {
    name: string;
    email: string;
    password: string;
    role: Role;
    status: string;
}
