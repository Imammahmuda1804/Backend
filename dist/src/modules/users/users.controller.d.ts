import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(user: {
        id: number;
        email: string;
        role: string;
    }): Promise<{
        id: number;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        status: string;
        profilePicture: string | null;
        createdAt: Date;
    }>;
    updateProfile(user: {
        id: number;
        email: string;
        role: string;
    }, dto: UpdateProfileDto): Promise<{
        id: number;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        profilePicture: string | null;
        createdAt: Date;
    }>;
    uploadAvatar(user: {
        id: number;
        email: string;
        role: string;
    }, file: Express.Multer.File): Promise<{
        id: number;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        profilePicture: string | null;
        createdAt: Date;
    }>;
}
