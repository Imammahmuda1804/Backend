import { UsersService } from '../users/users.service';
import { AdminUserQueryDto, AdminUpdateUserDto, AdminCreateUserDto } from '../users/dto';
export declare class AdminUsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getUsers(query: AdminUserQueryDto): Promise<{
        data: {
            status: string;
            name: string;
            email: string;
            profilePicture: string | null;
            role: import("@prisma/client").$Enums.Role;
            createdAt: Date;
            id: number;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            total_pages: number;
        };
    }>;
    getUserDetail(id: number): Promise<{
        status: string;
        name: string;
        email: string;
        profilePicture: string | null;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        favorites: ({
            destination: {
                name: string;
                id: number;
                city: string;
                province: string;
                thumbnailUrl: string | null;
            };
        } & {
            createdAt: Date;
            id: number;
            userId: number;
            destinationId: number;
        })[];
        searchLogs: {
            createdAt: Date;
            id: number;
            userId: number | null;
            keyword: string;
        }[];
        userReviews: ({
            destination: {
                name: string;
                id: number;
                city: string;
            };
        } & {
            createdAt: Date;
            id: number;
            userId: number;
            destinationId: number;
            rating: number;
            reviewText: string | null;
        })[];
        id: number;
    }>;
    createUser(dto: AdminCreateUserDto): Promise<{
        status: string;
        name: string;
        email: string;
        profilePicture: string | null;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        id: number;
    }>;
    updateUser(id: number, dto: AdminUpdateUserDto): Promise<{
        status: string;
        name: string;
        email: string;
        profilePicture: string | null;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        id: number;
    }>;
    suspendUser(id: number): Promise<{
        status: string;
        id: number;
    }>;
}
