import { PrismaService } from '../../prisma/prisma.service';
import { MediaStorageService } from '../storage/media-storage.service';
import type { UploadableImage } from '../storage/media-storage.types';
import { UpdateProfileDto, AdminUpdateUserDto, AdminCreateUserDto } from './dto';
export declare class UsersService {
    private readonly prisma;
    private readonly mediaStorage;
    constructor(prisma: PrismaService, mediaStorage: MediaStorageService);
    findById(id: number): Promise<{
        id: number;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        status: string;
        profilePicture: string | null;
        createdAt: Date;
    }>;
    findByEmail(email: string): Promise<{
        id: number;
        email: string;
        googleId: string | null;
        name: string;
        password: string | null;
        authProvider: string;
        emailVerified: boolean;
        role: import("@prisma/client").$Enums.Role;
        status: string;
        profilePicture: string | null;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    updateProfile(userId: number, dto: UpdateProfileDto): Promise<{
        id: number;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        profilePicture: string | null;
        createdAt: Date;
    }>;
    uploadAvatar(userId: number, file: UploadableImage): Promise<{
        id: number;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        profilePicture: string | null;
        createdAt: Date;
    }>;
    findAll(page: number, limit: number, search?: string): Promise<{
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
    findOneWithRelations(id: number): Promise<{
        id: number;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        status: string;
        profilePicture: string | null;
        createdAt: Date;
        favorites: ({
            destination: {
                id: number;
                name: string;
                city: string;
                province: string;
                thumbnailUrl: string | null;
            };
        } & {
            id: number;
            createdAt: Date;
            userId: number;
            destinationId: number;
        })[];
        searchLogs: {
            id: number;
            createdAt: Date;
            userId: number | null;
            keyword: string;
        }[];
        userReviews: ({
            destination: {
                id: number;
                name: string;
                city: string;
            };
        } & {
            id: number;
            createdAt: Date;
            userId: number;
            destinationId: number;
            rating: number;
            reviewText: string | null;
        })[];
    }>;
    adminCreate(dto: AdminCreateUserDto): Promise<{
        id: number;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        status: string;
        profilePicture: string | null;
        createdAt: Date;
    }>;
    adminUpdate(id: number, dto: AdminUpdateUserDto): Promise<{
        id: number;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        status: string;
        profilePicture: string | null;
        createdAt: Date;
    }>;
    softDelete(id: number): Promise<{
        id: number;
        status: string;
    }>;
    private assertEmailAvailable;
    private hashPasswordIfProvided;
    private buildProfileUpdateData;
    private buildAdminUpdateData;
    private buildIdentityUpdateData;
    private assignWhenPresent;
    private assignWhenDefined;
}
