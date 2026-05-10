import { UsersService } from '../users/users.service';
import { AdminUserQueryDto, AdminUpdateUserDto } from '../users/dto';
export declare class AdminUsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getUsers(query: AdminUserQueryDto): Promise<{
        data: {
            id: number;
            email: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
            status: string;
            profilePicture: string | null;
            createdAt: Date;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            total_pages: number;
        };
    }>;
    getUserDetail(id: number): Promise<{
        id: number;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        status: string;
        profilePicture: string | null;
        createdAt: Date;
        favorites: {
            id: number;
            createdAt: Date;
            userId: number;
            destinationId: number;
        }[];
        searchLogs: {
            id: number;
            createdAt: Date;
            userId: number | null;
            keyword: string;
        }[];
        userReviews: {
            id: number;
            createdAt: Date;
            userId: number;
            destinationId: number;
            rating: number;
            reviewText: string | null;
        }[];
    }>;
    updateUser(id: number, dto: AdminUpdateUserDto): Promise<{
        id: number;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        status: string;
        profilePicture: string | null;
        createdAt: Date;
    }>;
    suspendUser(id: number): Promise<{
        id: number;
        status: string;
    }>;
}
