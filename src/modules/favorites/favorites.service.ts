import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * POST /favorites/:destinationId
   * Simpan destinasi ke favorites. Handle duplicate gracefully.
   */
  async addFavorite(userId: number, destinationId: number) {
    // 1. Cek destination exists
    const destination = await this.prisma.destination.findFirst({
      where: { id: destinationId, deletedAt: null },
      select: { id: true, name: true },
    });

    if (!destination) {
      throw new NotFoundException('Destinasi tidak ditemukan');
    }

    // 2. Upsert — jika sudah ada, tidak error
    try {
      await this.prisma.favorite.create({
        data: { userId, destinationId },
      });
    } catch (error: unknown) {
      // Prisma unique constraint violation (P2002) → sudah di-favorite
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        // Sudah ada — return success tanpa error
        return { message: 'Destination already in favorites' };
      }
      throw error;
    }

    return { message: 'Destination saved to favorites' };
  }

  /**
   * GET /favorites
   * Paginated list favorites milik user.
   */
  async getFavorites(userId: number, page: number, limit: number) {
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

  /**
   * DELETE /favorites/:destinationId
   * Hapus dari favorites. 404 jika tidak ada.
   */
  async removeFavorite(userId: number, destinationId: number) {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_destinationId: { userId, destinationId },
      },
    });

    if (!favorite) {
      throw new NotFoundException('Destinasi tidak ada di favorites');
    }

    await this.prisma.favorite.delete({
      where: {
        userId_destinationId: { userId, destinationId },
      },
    });

    return { message: 'Destination removed from favorites' };
  }

  /**
   * GET /favorites/check/:destinationId
   * Cek apakah destinasi ada di daftar favorit.
   */
  async checkFavorite(
    userId: number,
    destinationId: number,
  ): Promise<{ isFavorite: boolean }> {
    const favorite = await this.prisma.favorite.findUnique({
      where: {
        userId_destinationId: { userId, destinationId },
      },
    });

    return { isFavorite: !!favorite };
  }
}
