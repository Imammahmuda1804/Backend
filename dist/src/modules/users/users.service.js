"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../../prisma/prisma.service");
const USER_PUBLIC_SELECT = {
    id: true,
    name: true,
    email: true,
    role: true,
    status: true,
    profilePicture: true,
    createdAt: true,
};
const USER_PROFILE_SELECT = {
    id: true,
    name: true,
    email: true,
    role: true,
    profilePicture: true,
    createdAt: true,
};
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: USER_PUBLIC_SELECT,
        });
        if (!user) {
            throw new common_1.NotFoundException('User tidak ditemukan');
        }
        return user;
    }
    async findByEmail(email) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }
    async updateProfile(userId, dto) {
        await this.assertEmailAvailable(dto.email, userId);
        const hashedPassword = await this.hashPasswordIfProvided(dto.password);
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: this.buildProfileUpdateData(dto, hashedPassword),
            select: USER_PROFILE_SELECT,
        });
        return updatedUser;
    }
    async findAll(page, limit, search) {
        const skip = (page - 1) * limit;
        const whereCondition = search
            ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            }
            : {};
        const [data, total] = await Promise.all([
            this.prisma.user.findMany({
                where: whereCondition,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: USER_PUBLIC_SELECT,
            }),
            this.prisma.user.count({ where: whereCondition }),
        ]);
        return {
            data,
            meta: {
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit),
            },
        };
    }
    async findOneWithRelations(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                profilePicture: true,
                createdAt: true,
                favorites: {
                    include: {
                        destination: {
                            select: {
                                id: true,
                                name: true,
                                city: true,
                                province: true,
                                thumbnailUrl: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                },
                userReviews: {
                    include: {
                        destination: {
                            select: {
                                id: true,
                                name: true,
                                city: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                },
                searchLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 30,
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User tidak ditemukan');
        }
        return user;
    }
    async adminCreate(dto) {
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existing)
            throw new common_1.ConflictException('Email sudah digunakan');
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        return this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email,
                password: hashedPassword,
                role: dto.role,
                status: dto.status,
            },
            select: USER_PUBLIC_SELECT,
        });
    }
    async adminUpdate(id, dto) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User tidak ditemukan');
        await this.assertEmailAvailable(dto.email, id, 'Email sudah digunakan');
        const hashedPassword = await this.hashPasswordIfProvided(dto.password);
        return this.prisma.user.update({
            where: { id },
            data: this.buildAdminUpdateData(dto, hashedPassword),
            select: USER_PUBLIC_SELECT,
        });
    }
    async softDelete(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User tidak ditemukan');
        return this.prisma.user.update({
            where: { id },
            data: { status: 'suspended' },
            select: { id: true, status: true },
        });
    }
    async assertEmailAvailable(email, currentUserId, message = 'Email sudah digunakan oleh pengguna lain') {
        if (!email)
            return;
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser && existingUser.id !== currentUserId) {
            throw new common_1.ConflictException(message);
        }
    }
    async hashPasswordIfProvided(password) {
        return password ? bcrypt.hash(password, 10) : undefined;
    }
    buildProfileUpdateData(dto, hashedPassword) {
        const data = this.buildIdentityUpdateData(dto, hashedPassword);
        this.assignWhenDefined(data, 'profilePicture', dto.profilePicture);
        return data;
    }
    buildAdminUpdateData(dto, hashedPassword) {
        const data = this.buildIdentityUpdateData(dto, hashedPassword);
        this.assignWhenPresent(data, 'role', dto.role);
        this.assignWhenPresent(data, 'status', dto.status);
        return data;
    }
    buildIdentityUpdateData(dto, hashedPassword) {
        const data = {};
        this.assignWhenPresent(data, 'name', dto.name);
        this.assignWhenPresent(data, 'email', dto.email);
        this.assignWhenPresent(data, 'password', hashedPassword);
        return data;
    }
    assignWhenPresent(data, key, value) {
        if (value !== undefined && value !== '') {
            data[key] = value;
        }
    }
    assignWhenDefined(data, key, value) {
        if (value !== undefined) {
            data[key] = value;
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map