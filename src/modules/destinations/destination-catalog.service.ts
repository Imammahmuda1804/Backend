import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DESTINATION_CATEGORIES } from './destination-categories';

type DestinationListItem = Prisma.DestinationGetPayload<{
  include: {
    images: true;
    destinationTopics: {
      include: {
        topic: {
          select: {
            id: true;
            topicName: true;
            keywords: true;
          };
        };
      };
    };
  };
}>;

@Injectable()
export class DestinationCatalogService {
  constructor(private readonly prisma: PrismaService) {}
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
    const whereCondition = this.buildDestinationListWhere({
      search,
      topicId,
      topicIds,
      city,
      category,
    });

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

    return this.buildDestinationListResponse(data, page, limit, total);
  }

  private buildDestinationListWhere(input: {
    search?: string;
    topicId?: number;
    topicIds?: number[];
    city?: string;
    category?: string;
  }): Prisma.DestinationWhereInput {
    const effectiveTopicIds = this.resolveTopicFilterIds(
      input.topicId,
      input.topicIds,
    );

    return {
      deletedAt: null,
      ...this.buildSearchFilter(input.search),
      ...this.buildTopicFilter(effectiveTopicIds),
      ...this.buildCityFilter(input.city),
      ...this.buildCategoryFilter(input.category),
    };
  }

  private resolveTopicFilterIds(topicId?: number, topicIds?: number[]) {
    if (topicIds && topicIds.length > 0) return topicIds;
    return topicId ? [topicId] : [];
  }

  private buildSearchFilter(search?: string): Prisma.DestinationWhereInput {
    if (!search) return {};
    return {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { city: { contains: search, mode: 'insensitive' as const } },
      ],
    };
  }

  private buildTopicFilter(topicIds: number[]): Prisma.DestinationWhereInput {
    if (topicIds.length === 0) return {};
    return {
      destinationTopics: {
        some: { topicId: { in: topicIds } },
      },
    };
  }

  private buildCityFilter(city?: string): Prisma.DestinationWhereInput {
    return city ? { city: { equals: city, mode: 'insensitive' as const } } : {};
  }

  private buildCategoryFilter(category?: string): Prisma.DestinationWhereInput {
    return category
      ? { category: { equals: category, mode: 'insensitive' as const } }
      : {};
  }

  private buildDestinationListResponse(
    data: DestinationListItem[],
    page: number,
    limit: number,
    total: number,
  ) {
    return {
      data: data.map((destination) => ({
        ...destination,
        topics: this.mapDestinationTopics(destination),
      })),
      meta: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  private mapDestinationTopics(destination: DestinationListItem) {
    return destination.destinationTopics.map((item) => ({
      id: item.topic.id,
      name: item.topic.topicName,
      topic_name: item.topic.topicName,
      keywords: item.topic.keywords,
      total_reviews: item.totalReviews,
    }));
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
          description: true,
          city: true,
          province: true,
          latitude: true,
          longitude: true,
          googlePlaceId: true,
          googleMapsUrl: true,
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
        latitude: true,
        longitude: true,
        googlePlaceId: true,
        googleMapsUrl: true,
        thumbnailUrl: true,
        googleRating: true,
        userRating: true,
        positiveRatio: true,
        recommendationScore: true,
      },
    });
  }
}
