import { Injectable } from '@nestjs/common';
import { findActiveDestinationIdentity } from '../../common/utils/destination-lookup.util';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  // Menambahkan destinasi ke favorit.
  async addFavorite(userId: number, destinationId: number) {
    await this.ensureDestinationExists(destinationId);
    return this.createFavoriteOrReturnExisting(userId, destinationId);
  }

  private async ensureDestinationExists(destinationId: number) {
    await findActiveDestinationIdentity(this.prisma, destinationId);
  }

  private async createFavoriteOrReturnExisting(
    userId: number,
    destinationId: number,
  ) {
    try {
      await this.prisma.favorite.create({
        data: { userId, destinationId },
      });
      return { message: 'Destination saved to favorites' };
    } catch (error: unknown) {
      // Jika favorit sudah ada, kembalikan sukses.
      if (this.isUniqueConstraintError(error)) return this.existingFavorite();
      throw error;
    }
  }

  private isUniqueConstraintError(error: unknown) {
    return (
      error !== null &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    );
  }

  private existingFavorite() {
    return { message: 'Destination already in favorites' };
  }

  // Mengambil daftar favorit user.
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

  // Menghapus destinasi dari favorit.
  async removeFavorite(userId: number, destinationId: number) {
    await this.prisma.favorite.deleteMany({
      where: { userId, destinationId },
    });

    return { message: 'Destination removed from favorites' };
  }

  // Mengecek status favorit user.
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
