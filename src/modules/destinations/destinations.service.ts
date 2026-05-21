import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { promises as fs } from 'fs';
import * as path from 'path';
import {
  CreateDestinationDto,
  UpdateDestinationDto,
  UpdateMapsUrlDto,
} from './dto';
import { generateUniqueSlug } from '../../common/utils/slug.util';
import type { Prisma } from '@prisma/client';
import { DESTINATION_CATEGORIES } from './destination-categories';

type TopicGroupAggregation = {
  groupId: number;
  groupName: string;
  totalReviews: number;
  sentimentBreakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  topics: Map<number, { id: number; topicName: string; totalReviews: number }>;
};

@Injectable()
// Mengelola data destinasi, media, detail publik, ranking, dan agregasi topik.
export class DestinationsService {
  constructor(private readonly prisma: PrismaService) {}

  // Membuat destinasi baru dan menghasilkan slug unik.
  async create(dto: CreateDestinationDto) {
    const existingDestinations = await this.prisma.destination.findMany({
      select: { slug: true },
    });
    const existingSlugs = existingDestinations.map((d) => d.slug);
    const uniqueSlug = generateUniqueSlug(dto.name, existingSlugs);

    try {
      return await this.prisma.destination.create({
        data: {
          name: dto.name,
          slug: uniqueSlug,
          description: dto.description,
          city: dto.city,
          province: dto.province,
          category: dto.category,
          latitude: dto.latitude,
          longitude: dto.longitude,
          googleMapsUrl: dto.googleMapsUrl,
          youtubeUrl: dto.youtubeUrl,
          thumbnailUrl: dto.thumbnailUrl,
          googleRating: dto.googleRating,
          googleReviewCount: dto.googleReviewCount,
        },
      });
    } catch (error: unknown) {
      // Menangani slug atau nama yang sudah dipakai.
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

  // Mengambil daftar destinasi dengan pagination dan filter.
  async findAll(
    page: number,
    limit: number,
    search?: string,
    topicId?: number,
    topicIds?: number[],
    city?: string,
    category?: string,
  ) {
    const skip = (page - 1) * limit;

    // Memilih filter topik multi jika tersedia.
    const effectiveTopicIds =
      topicIds && topicIds.length > 0 ? topicIds : topicId ? [topicId] : [];

    const whereCondition: Prisma.DestinationWhereInput = {
      deletedAt: null, // Abaikan data soft delete.
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { city: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(effectiveTopicIds.length > 0 && {
        destinationTopics: {
          some: {
            topicId: { in: effectiveTopicIds },
          },
        },
      }),
      ...(city && {
        city: { equals: city, mode: 'insensitive' as const },
      }),
      ...(category && {
        category: { equals: category, mode: 'insensitive' as const },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.destination.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          images: true,
          destinationTopics: {
            orderBy: { totalReviews: 'desc' },
            take: 3,
            include: {
              topic: {
                select: {
                  id: true,
                  topicName: true,
                  keywords: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.destination.count({
        where: whereCondition,
      }),
    ]);

    return {
      data: data.map((destination) => ({
        ...destination,
        topics: destination.destinationTopics.map((item) => ({
          id: item.topic.id,
          name: item.topic.topicName,
          topic_name: item.topic.topicName,
          keywords: item.topic.keywords,
          total_reviews: item.totalReviews,
        })),
      })),
      meta: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  // Mengambil daftar kategori tetap untuk filter dan form destinasi.
  getCategories() {
    return DESTINATION_CATEGORIES;
  }

  // Mengambil daftar kota dari destinasi yang belum dihapus.
  async getCities(): Promise<string[]> {
    const results = await this.prisma.destination.findMany({
      where: { deletedAt: null },
      select: { city: true },
      distinct: ['city'],
      orderBy: { city: 'asc' },
    });
    return results.map((r) => r.city).filter(Boolean);
  }

  // Mengambil detail destinasi lengkap untuk admin.
  async findOneAdmin(id: number) {
    const destination = await this.prisma.destination.findUnique({
      where: { id },
      include: {
        images: true,
        sentimentTrends: {
          orderBy: { date: 'desc' },
          take: 30, // Ringkasan 30 hari terakhir.
        },
        scrapingJobs: {
          orderBy: { startedAt: 'desc' },
          take: 5, // Lima job scraping terakhir.
        },
        destinationTopics: {
          include: {
            topic: {
              include: {
                group: true,
              },
            },
          },
        },
      },
    });

    if (!destination) {
      throw new NotFoundException('Destinasi tidak ditemukan');
    }

    return destination;
  }

  // Memperbarui data utama destinasi.
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
        category: dto.category,
        latitude: dto.latitude,
        longitude: dto.longitude,
        googleMapsUrl: dto.googleMapsUrl,
        youtubeUrl: dto.youtubeUrl,
        thumbnailUrl: dto.thumbnailUrl,
        ...(dto.googleRating !== undefined && {
          googleRating: dto.googleRating,
        }),
        ...(dto.googleReviewCount !== undefined && {
          googleReviewCount: dto.googleReviewCount,
        }),
      },
    });
  }

  // Menandai destinasi sebagai terhapus tanpa menghapus baris database.
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

  // Memperbarui URL Google Maps destinasi.
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

  // Mengganti thumbnail destinasi dan menghapus file lokal lama.
  async uploadThumbnail(destinationId: number, filename: string) {
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
      await this.removeFileIfExists(filepath);
      throw new NotFoundException('Destinasi tidak ditemukan');
    }

    if (destination.thumbnailUrl?.startsWith('/uploads/')) {
      const oldFilename = path.basename(destination.thumbnailUrl);
      const oldFilepath = path.join(
        process.cwd(),
        'uploads',
        'destinations',
        oldFilename,
      );
      await this.removeFileIfExists(oldFilepath);
    }

    const thumbnailUrl = `/uploads/destinations/${filename}`;
    return this.prisma.destination.update({
      where: { id: destinationId },
      data: { thumbnailUrl },
    });
  }

  // Menambahkan satu gambar galeri destinasi.
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
      await this.removeFileIfExists(filepath);
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

  // Menghapus gambar galeri dari database dan file lokal.
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
    await this.removeFileIfExists(filepath);

    return this.prisma.destinationImage.delete({
      where: { id: imageId },
    });
  }

  // Mengambil rekomendasi destinasi berdasarkan skor rekomendasi.
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
      this.prisma.destination.count({
        where: whereCondition,
      }),
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

  // Mengambil detail publik destinasi berdasarkan id.
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

    // Menghitung rating user aplikasi.
    const reviewAgg = await this.prisma.userReview.aggregate({
      where: { destinationId: id },
      _avg: { rating: true },
      _count: true,
    });

    // Menghitung rating dari review Google Maps.
    const scrapedAgg = await this.prisma.review.aggregate({
      where: { destinationId: id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    // Menghitung sentimen per topik.
    const topicSentimentBreakdown = await this.buildTopicSentimentBreakdown(id);
    const topicGroups = await this.buildTopicGroups(id);

    return {
      ...destination,
      // Review user aplikasi.
      averageUserRating: reviewAgg._avg.rating || null,
      totalUserReviews: reviewAgg._count,
      // Review hasil scraping Google Maps.
      scrapedAverageRating: scrapedAgg._avg.rating
        ? parseFloat(scrapedAgg._avg.rating.toFixed(2))
        : destination.userRating,
      scrapedReviewCount: scrapedAgg._count.rating,
      topicSentimentBreakdown,
      topicGroups,
    };
  }

  // Mengambil detail publik destinasi berdasarkan slug.
  async findOnePublicBySlug(slug: string) {
    const destination = await this.prisma.destination.findFirst({
      where: { slug, deletedAt: null },
      include: {
        images: true,
        sentimentTrends: {
          orderBy: { date: 'asc' }, // Chart memakai urutan tanggal naik.
          take: 30,
        },
        destinationTopics: {
          include: {
            topic: {
              include: {
                group: true,
              },
            },
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

    // Menghitung rating user aplikasi.
    const reviewAgg = await this.prisma.userReview.aggregate({
      where: { destinationId: destination.id },
      _avg: { rating: true },
      _count: true,
    });

    // Menghitung rating dari review Google Maps.
    const scrapedAgg = await this.prisma.review.aggregate({
      where: { destinationId: destination.id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    // Menghitung sentimen per topik.
    const topicSentimentBreakdown = await this.buildTopicSentimentBreakdown(
      destination.id,
    );
    const topicGroups = await this.buildTopicGroups(destination.id);

    return {
      ...destination,
      // Review user aplikasi.
      averageUserRating: reviewAgg._avg.rating || null,
      totalUserReviews: reviewAgg._count,
      // Review hasil scraping Google Maps.
      scrapedAverageRating: scrapedAgg._avg.rating
        ? parseFloat(scrapedAgg._avg.rating.toFixed(2))
        : destination.userRating,
      scrapedReviewCount: scrapedAgg._count.rating,
      topicSentimentBreakdown,
      topicGroups,
    };
  }

  // Mengambil ranking destinasi berdasarkan skor, sentimen, atau rating.
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

  // Mengambil review Google Maps yang berkaitan dengan satu topik sempit.
  async getReviewsByTopic(
    destinationId: number,
    topicId: number,
    page: number,
    limit: number,
  ) {
    const destination = await this.prisma.destination.findFirst({
      where: { id: destinationId, deletedAt: null },
      select: { id: true },
    });

    if (!destination) {
      throw new NotFoundException('Destinasi tidak ditemukan');
    }

    const skip = (page - 1) * limit;

    const total = await this.prisma.review.count({
      where: { destinationId, topicId },
    });

    const reviews = await this.prisma.review.findMany({
      where: { destinationId, topicId },
      skip,
      take: limit,
      orderBy: { reviewDate: 'desc' },
      select: {
        id: true,
        reviewerName: true,
        reviewText: true,
        rating: true,
        reviewDate: true,
        sentiment: true,
        likesCount: true,
      },
    });

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Mengambil review dari semua topik sempit dalam satu topic group.
  async getReviewsByTopicGroup(
    destinationId: number,
    groupId: number,
    page: number,
    limit: number,
  ) {
    const destination = await this.prisma.destination.findFirst({
      where: { id: destinationId, deletedAt: null },
      select: { id: true },
    });

    if (!destination) {
      throw new NotFoundException('Destinasi tidak ditemukan');
    }

    const topics = await this.prisma.topic.findMany({
      where: { groupId },
      select: { id: true },
    });
    const topicIds = topics.map((topic) => topic.id);

    if (topicIds.length === 0) {
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 },
      };
    }

    const skip = (page - 1) * limit;

    const where = {
      destinationId,
      topicId: { in: topicIds },
    };

    const [total, reviews] = await Promise.all([
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { reviewDate: 'desc' },
        select: {
          id: true,
          reviewerName: true,
          reviewText: true,
          rating: true,
          reviewDate: true,
          sentiment: true,
          likesCount: true,
          topicId: true,
          topic: {
            select: {
              id: true,
              topicName: true,
            },
          },
        },
      }),
    ]);

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Mengelompokkan topik sempit menjadi topic group untuk halaman detail.
  private async buildTopicGroups(destinationId: number) {
    const grouped = await this.prisma.review.groupBy({
      by: ['topicId', 'sentiment'],
      where: {
        destinationId,
        topicId: { not: null },
      },
      _count: { sentiment: true },
    });

    const topicIds = Array.from(
      new Set(
        grouped
          .map((row) => row.topicId)
          .filter((topicId): topicId is number => topicId !== null),
      ),
    );

    if (topicIds.length === 0) return [];

    const topics = await this.prisma.topic.findMany({
      where: {
        id: { in: topicIds },
        isDetailVisible: true,
      },
      include: {
        group: true,
      },
    });

    const fallbackGroup = await this.prisma.topicGroup.findFirst({
      where: { groupName: { contains: 'Lain', mode: 'insensitive' } },
      orderBy: { displayOrder: 'asc' },
    });

    const topicMap = new Map(topics.map((topic) => [topic.id, topic]));
    const groups = new Map<number, TopicGroupAggregation>();

    for (const row of grouped) {
      if (row.topicId === null) continue;
      const topic = topicMap.get(row.topicId);
      if (!topic) continue;

      const groupId = topic.groupId ?? fallbackGroup?.id ?? 0;
      const groupName =
        topic.group?.groupName ?? fallbackGroup?.groupName ?? 'Lainnya';

      const group = groups.get(groupId) ?? {
        groupId,
        groupName,
        totalReviews: 0,
        sentimentBreakdown: { positive: 0, negative: 0, neutral: 0 },
        topics: new Map<
          number,
          { id: number; topicName: string; totalReviews: number }
        >(),
      };

      const count = row._count.sentiment;
      group.totalReviews += count;

      const sentiment = (row.sentiment || '').toLowerCase();
      if (sentiment === 'positive' || sentiment === 'positif') {
        group.sentimentBreakdown.positive += count;
      } else if (sentiment === 'negative' || sentiment === 'negatif') {
        group.sentimentBreakdown.negative += count;
      } else {
        group.sentimentBreakdown.neutral += count;
      }

      const fineTopic = group.topics.get(topic.id) ?? {
        id: topic.id,
        topicName: topic.topicName,
        totalReviews: 0,
      };
      fineTopic.totalReviews += count;
      group.topics.set(topic.id, fineTopic);
      groups.set(groupId, group);
    }

    return Array.from(groups.values())
      .map((group) => ({
        groupId: group.groupId,
        groupName: group.groupName,
        totalReviews: group.totalReviews,
        sentimentBreakdown: group.sentimentBreakdown,
        topics: Array.from(group.topics.values()).sort(
          (a, b) => b.totalReviews - a.totalReviews,
        ),
      }))
      .sort((a, b) => b.totalReviews - a.totalReviews);
  }

  // Membuat ringkasan sentimen per topik.
  // Menghitung sentimen positif, negatif, dan netral per topik.
  private async buildTopicSentimentBreakdown(
    destinationId: number,
  ): Promise<
    Record<number, { positive: number; negative: number; neutral: number }>
  > {
    const grouped = await this.prisma.review.groupBy({
      by: ['topicId', 'sentiment'],
      where: {
        destinationId,
        topicId: { not: null },
        sentiment: { not: null },
      },
      _count: { sentiment: true },
    });

    const breakdown: Record<
      number,
      { positive: number; negative: number; neutral: number }
    > = {};

    for (const row of grouped) {
      if (row.topicId === null) continue;
      if (!breakdown[row.topicId]) {
        breakdown[row.topicId] = { positive: 0, negative: 0, neutral: 0 };
      }
      const sentiment = (row.sentiment || '').toLowerCase();
      if (sentiment === 'positive' || sentiment === 'positif') {
        breakdown[row.topicId].positive = row._count.sentiment;
      } else if (sentiment === 'negative' || sentiment === 'negatif') {
        breakdown[row.topicId].negative = row._count.sentiment;
      } else {
        breakdown[row.topicId].neutral = row._count.sentiment;
      }
    }

    return breakdown;
  }

  // Menghapus file lokal jika ada tanpa melempar error saat file hilang.
  private async removeFileIfExists(filepath: string): Promise<void> {
    await fs.rm(filepath, { force: true });
  }
}
