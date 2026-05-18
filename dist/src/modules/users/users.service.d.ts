import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto, AdminUpdateUserDto, AdminCreateUserDto } from './dto';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: number): Promise<{
        status: string;
        name: string;
        email: string;
        profilePicture: string | null;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        id: number;
    }>;
    findByEmail(email: string): Promise<{
        status: string;
        name: string;
        email: string;
        password: string;
        profilePicture: string | null;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        updatedAt: Date;
        id: number;
    } | null>;
    updateProfile(userId: number, dto: UpdateProfileDto): Promise<{
        name: string;
        email: string;
        profilePicture: string | null;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        id: number;
    }>;
    findAll(page: number, limit: number, search?: string): Promise<{
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
    findOneWithRelations(id: number): Promise<{
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
    adminCreate(dto: AdminCreateUserDto): Promise<{
        status: string;
        name: string;
        email: string;
        profilePicture: string | null;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        id: number;
    }>;
    adminUpdate(id: number, dto: AdminUpdateUserDto): Promise<{
        status: string;
        name: string;
        email: string;
        profilePicture: string | null;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        id: number;
    }>;
    softDelete(id: number): Promise<{
        status: string;
        id: number;
    }>;
}
