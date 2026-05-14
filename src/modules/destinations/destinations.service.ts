import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import {
  CreateDestinationDto,
  UpdateDestinationDto,
  UpdateMapsUrlDto,
} from './dto';
import { generateUniqueSlug } from '../../common/utils/slug.util';

@Injectable()
export class DestinationsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreateDestinationDto) {
    // 1. Generate slug
    const existingDestinations = await this.prisma.destination.findMany({
      select: { slug: true },
    });
    const existingSlugs = existingDestinations.map((d) => d.slug);
    const uniqueSlug = generateUniqueSlug(dto.name, existingSlugs);

    // 2. Create destination
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
    } catch (error: unknown) {
      // Prisma error for unique constraint
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Destinasi dengan nama ini mungkin sudah ada',
        );
      }
      throw error;
    }
  }

  async findAll(page: number, limit: number, search?: string, topicId?: number) {
    const skip = (page - 1) * limit;

    const whereCondition: any = {
      deletedAt: null, // Exclude soft-deleted
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { city: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(topicId && {
        destinationTopics: {
          some: {
            topicId: topicId,
          },
        },
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

  async findOneAdmin(id: number) {
    const destination = await this.prisma.destination.findUnique({
      where: { id },
      include: {
        images: true,
        sentimentTrends: {
          orderBy: { date: 'desc' },
          take: 30, // Last 30 days summary
        },
        scrapingJobs: {
          orderBy: { startedAt: 'desc' },
          take: 5, // Last 5 scraping jobs
        },
        destinationTopics: {
          include: {
            topic: true,
          },
        },
      },
    });

    if (!destination) {
      throw new NotFoundException('Destinasi tidak ditemukan');
    }

    return destination;
  }

  async update(id: number, dto: UpdateDestinationDto) {
    const destination = await this.prisma.destination.findUnique({
      where: { id },
    });
    if (!destination) {
      throw new NotFoundException('Destinasi tidak ditemukan');
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

  async softDelete(id: number) {
    const destination = await this.prisma.destination.findUnique({
      where: { id },
    });
    if (!destination) {
      throw new NotFoundException('Destinasi tidak ditemukan');
    }

    return this.prisma.destination.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async updateMapsUrl(id: number, dto: UpdateMapsUrlDto) {
    const destination = await this.prisma.destination.findUnique({
      where: { id },
    });
    if (!destination) {
      throw new NotFoundException('Destinasi tidak ditemukan');
    }

    return this.prisma.destination.update({
      where: { id },
      data: { googleMapsUrl: dto.googleMapsUrl },
    });
  }

  async uploadThumbnail(destinationId: number, filename: string) {
    const destination = await this.prisma.destination.findUnique({
      where: { id: destinationId },
    });
    if (!destination) {
      const filepath = path.join(process.cwd(), 'uploads', 'destinations', filename);
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      throw new NotFoundException('Destinasi tidak ditemukan');
    }

    // Delete old thumbnail file if it was a local upload
    if (destination.thumbnailUrl?.startsWith('/uploads/')) {
      const oldFilename = path.basename(destination.thumbnailUrl);
      const oldFilepath = path.join(process.cwd(), 'uploads', 'destinations', oldFilename);
      if (fs.existsSync(oldFilepath)) fs.unlinkSync(oldFilepath);
    }

    const thumbnailUrl = `/uploads/destinations/${filename}`;
    return this.prisma.destination.update({
      where: { id: destinationId },
      data: { thumbnailUrl },
    });
  }

  async uploadImage(destinationId: number, filename: string) {
    const destination = await this.prisma.destination.findUnique({
      where: { id: destinationId },
    });
    if (!destination) {
      const filepath = path.join(
        process.cwd(),
        'uploads',
        'destinations',
        filename,
      );
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      throw new NotFoundException('Destinasi tidak ditemukan');
    }

    const imageUrl = `/uploads/destinations/${filename}`;

    return this.prisma.destinationImage.create({
      data: {
        destinationId,
        imageUrl,
      },
    });
  }

  async deleteImage(imageId: number) {
    const image = await this.prisma.destinationImage.findUnique({
      where: { id: imageId },
    });
    if (!image) {
      throw new NotFoundException('Image tidak ditemukan');
    }

    const filename = path.basename(image.imageUrl);
    const filepath = path.join(
      process.cwd(),
      'uploads',
      'destinations',
      filename,
    );
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    return this.prisma.destinationImage.delete({
      where: { id: imageId },
    });
  }

  // --- PUBLIC ENDPOINTS ---

  async findRecommendations(page: number, limit: number) {
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

  async findOnePublic(id: number) {
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
      throw new NotFoundException('Destinasi tidak ditemukan');
    }

    // Aggregate user (platform) rating
    const reviewAgg = await this.prisma.userReview.aggregate({
      where: { destinationId: id },
      _avg: { rating: true },
      _count: true,
    });

    // Aggregate scraped (Google Maps) review rating
    const scrapedAgg = await this.prisma.review.aggregate({
      where: { destinationId: id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      ...destination,
      // Platform user reviews
      averageUserRating: reviewAgg._avg.rating || null,
      totalUserReviews: reviewAgg._count,
      // Scraped Google Maps reviews
      scrapedAverageRating: scrapedAgg._avg.rating
        ? parseFloat(scrapedAgg._avg.rating.toFixed(2))
        : destination.userRating,
      scrapedReviewCount: scrapedAgg._count.rating,
    };
  }

  async findOnePublicBySlug(slug: string) {
    const destination = await this.prisma.destination.findFirst({
      where: { slug, deletedAt: null },
      include: {
        images: true,
        sentimentTrends: {
          orderBy: { date: 'asc' }, // usually charts need ascending dates
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
      throw new NotFoundException('Destinasi tidak ditemukan');
    }

    // Aggregate user (platform) rating
    const reviewAgg = await this.prisma.userReview.aggregate({
      where: { destinationId: destination.id },
      _avg: { rating: true },
      _count: true,
    });

    // Aggregate scraped (Google Maps) review rating
    const scrapedAgg = await this.prisma.review.aggregate({
      where: { destinationId: destination.id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      ...destination,
      // Platform user reviews
      averageUserRating: reviewAgg._avg.rating || null,
      totalUserReviews: reviewAgg._count,
      // Scraped Google Maps reviews
      scrapedAverageRating: scrapedAgg._avg.rating
        ? parseFloat(scrapedAgg._avg.rating.toFixed(2))
        : destination.userRating,
      scrapedReviewCount: scrapedAgg._count.rating,
    };
  }

  async findRanking(sortBy: string, limit: number) {
    let orderBy: Record<string, 'asc' | 'desc'> = {
      recommendationScore: 'desc',
    };

    if (sortBy === 'sentiment') {
      orderBy = { positiveRatio: 'desc' };
    } else if (sortBy === 'rating') {
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
}
