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
exports.DestinationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const slug_util_1 = require("../../common/utils/slug.util");
let DestinationsService = class DestinationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const existingDestinations = await this.prisma.destination.findMany({
            select: { slug: true },
        });
        const existingSlugs = existingDestinations.map((d) => d.slug);
        const uniqueSlug = (0, slug_util_1.generateUniqueSlug)(dto.name, existingSlugs);
        try {
            return await this.prisma.destination.create({
                data: {
                    name: dto.name,
                    slug: uniqueSlug,
                    description: dto.description,
                    city: dto.city,
                    province: dto.province,
                    latitude: dto.latitude,
                    longitude: dto.longitude,
                    googleMapsUrl: dto.googleMapsUrl,
                    youtubeUrl: dto.youtubeUrl,
                    thumbnailUrl: dto.thumbnailUrl,
                },
            });
        }
        catch (error) {
            if (error &&
                typeof error === 'object' &&
                'code' in error &&
                error.code === 'P2002') {
                throw new common_1.ConflictException('Destinasi dengan nama ini mungkin sudah ada');
            }
            throw error;
        }
    }
    async findAll(page, limit, search) {
        const skip = (page - 1) * limit;
        const whereCondition = {
            deletedAt: null,
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { city: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };
        const [data, total] = await Promise.all([
            this.prisma.destination.findMany({
                where: whereCondition,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.destination.count({ where: whereCondition }),
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
    async findOneAdmin(id) {
        const destination = await this.prisma.destination.findUnique({
            where: { id },
            include: {
                images: true,
                sentimentTrends: {
                    orderBy: { date: 'desc' },
                    take: 30,
                },
                scrapingJobs: {
                    orderBy: { startedAt: 'desc' },
                    take: 5,
                },
                destinationTopics: {
                    include: {
                        topic: true,
                    },
                },
            },
        });
        if (!destination) {
            throw new common_1.NotFoundException('Destinasi tidak ditemukan');
        }
        return destination;
    }
    async update(id, dto) {
        const destination = await this.prisma.destination.findUnique({
            where: { id },
        });
        if (!destination) {
            throw new common_1.NotFoundException('Destinasi tidak ditemukan');
        }
        return this.prisma.destination.update({
            where: { id },
            data: {
                name: dto.name,
                description: dto.description,
                city: dto.city,
                province: dto.province,
                latitude: dto.latitude,
                longitude: dto.longitude,
                googleMapsUrl: dto.googleMapsUrl,
                youtubeUrl: dto.youtubeUrl,
                thumbnailUrl: dto.thumbnailUrl,
            },
        });
    }
    async softDelete(id) {
        const destination = await this.prisma.destination.findUnique({
            where: { id },
        });
        if (!destination) {
            throw new common_1.NotFoundException('Destinasi tidak ditemukan');
        }
        return this.prisma.destination.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    async updateMapsUrl(id, dto) {
        const destination = await this.prisma.destination.findUnique({
            where: { id },
        });
        if (!destination) {
            throw new common_1.NotFoundException('Destinasi tidak ditemukan');
        }
        return this.prisma.destination.update({
            where: { id },
            data: { googleMapsUrl: dto.googleMapsUrl },
        });
    }
    async uploadImage(destinationId, filename) {
        const destination = await this.prisma.destination.findUnique({
            where: { id: destinationId },
        });
        if (!destination) {
            const filepath = path.join(process.cwd(), 'uploads', 'destinations', filename);
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
            throw new common_1.NotFoundException('Destinasi tidak ditemukan');
        }
        const imageUrl = `/uploads/destinations/${filename}`;
        return this.prisma.destinationImage.create({
            data: {
                destinationId,
                imageUrl,
            },
        });
    }
    async deleteImage(imageId) {
        const image = await this.prisma.destinationImage.findUnique({
            where: { id: imageId },
        });
        if (!image) {
            throw new common_1.NotFoundException('Image tidak ditemukan');
        }
        const filename = path.basename(image.imageUrl);
        const filepath = path.join(process.cwd(), 'uploads', 'destinations', filename);
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }
        return this.prisma.destinationImage.delete({
            where: { id: imageId },
        });
    }
    async findRecommendations(page, limit) {
        const skip = (page - 1) * limit;
        const whereCondition = { deletedAt: null };
        const [data, total] = await Promise.all([
            this.prisma.destination.findMany({
                where: whereCondition,
                skip,
                take: limit,
                orderBy: { recommendationScore: 'desc' },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    city: true,
                    province: true,
                    thumbnailUrl: true,
                    googleRating: true,
                    userRating: true,
                    positiveRatio: true,
                    recommendationScore: true,
                },
            }),
            this.prisma.destination.count({ where: whereCondition }),
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
    async findOnePublic(id) {
        const destination = await this.prisma.destination.findFirst({
            where: { id, deletedAt: null },
            include: {
                images: true,
                sentimentTrends: {
                    orderBy: { date: 'desc' },
                    take: 30,
                },
                destinationTopics: {
                    include: {
                        topic: true,
                    },
                },
                userReviews: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                profilePicture: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!destination) {
            throw new common_1.NotFoundException('Destinasi tidak ditemukan');
        }
        const reviewAgg = await this.prisma.userReview.aggregate({
            where: { destinationId: id },
            _avg: { rating: true },
            _count: true,
        });
        return {
            ...destination,
            averageUserRating: reviewAgg._avg.rating || destination.userRating,
            totalUserReviews: reviewAgg._count,
        };
    }
    async findRanking(sortBy, limit) {
        let orderBy = {
            recommendationScore: 'desc',
        };
        if (sortBy === 'sentiment') {
            orderBy = { positiveRatio: 'desc' };
        }
        else if (sortBy === 'rating') {
            orderBy = { googleRating: 'desc' };
        }
        return this.prisma.destination.findMany({
            where: { deletedAt: null },
            take: limit,
            orderBy,
            select: {
                id: true,
                name: true,
                slug: true,
                city: true,
                province: true,
                thumbnailUrl: true,
                googleRating: true,
                userRating: true,
                positiveRatio: true,
                recommendationScore: true,
            },
        });
    }
};
exports.DestinationsService = DestinationsService;
exports.DestinationsService = DestinationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DestinationsService);
//# sourceMappingURL=destinations.service.js.map