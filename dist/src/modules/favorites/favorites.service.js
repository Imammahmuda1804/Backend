"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FavoritesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let FavoritesService = class FavoritesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async addFavorite(userId, destinationId) {
        const destination = await this.prisma.destination.findFirst({
            where: { id: destinationId, deletedAt: null },
            select: { id: true, name: true },
        });
        if (!destination) {
            throw new common_1.NotFoundException('Destinasi tidak ditemukan');
        }
        try {
            await this.prisma.favorite.create({
                data: { userId, destinationId },
            });
        }
        catch (error) {
            if (error &&
                typeof error === 'object' &&
                'code' in error &&
                error.code === 'P2002') {
                return { message: 'Destination already in favorites' };
            }
            throw error;
        }
        return { message: 'Destination saved to favorites' };
    }
    async getFavorites(userId, page, limit) {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.favorite.findMany({
                where: { userId },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    createdAt: true,
                    destination: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            city: true,
                            province: true,
                            thumbnailUrl: true,
                            googleRating: true,
                            positiveRatio: true,
                            recommendationScore: true,
                        },
                    },
                },
            }),
            this.prisma.favorite.count({ where: { userId } }),
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
    async removeFavorite(userId, destinationId) {
        const favorite = await this.prisma.favorite.findUnique({
            where: {
                userId_destinationId: { userId, destinationId },
            },
        });
        if (!favorite) {
            throw new common_1.NotFoundException('Destinasi tidak ada di favorites');
        }
        await this.prisma.favorite.delete({
            where: {
                userId_destinationId: { userId, destinationId },
            },
        });
        return { message: 'Destination removed from favorites' };
    }
    async checkFavorite(userId, destinationId) {
        const favorite = await this.prisma.favorite.findUnique({
            where: {
                userId_destinationId: { userId, destinationId },
            },
        });
        return { isFavorite: !!favorite };
    }
};
exports.FavoritesService = FavoritesService;
exports.FavoritesService = FavoritesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FavoritesService);
//# sourceMappingURL=favorites.service.js.map