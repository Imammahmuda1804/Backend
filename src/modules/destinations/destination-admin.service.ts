import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { promises as fs } from 'fs';
import * as path from 'path';
import { generateUniqueSlug } from '../../common/utils/slug.util';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateDestinationDto,
  UpdateDestinationDto,
  UpdateMapsUrlDto,
} from './dto';

@Injectable()
export class DestinationAdminService {
  constructor(private readonly prisma: PrismaService) {}
  // Membuat destinasi baru dan menghasilkan slug unik.
  async create(dto: CreateDestinationDto) {
    const uniqueSlug = await this.createUniqueSlug(dto.name);

    try {
      return await this.prisma.destination.create({
        data: this.buildCreateDestinationData(dto, uniqueSlug),
      });
    } catch (error: unknown) {
      // Menangani slug atau nama yang sudah dipakai.
      if (this.isPrismaUniqueError(error)) this.throwDuplicateDestination();
      throw error;
    }
  }

  private async createUniqueSlug(destinationName: string) {
    const existingDestinations = await this.prisma.destination.findMany({
      select: { slug: true },
    });
    const existingSlugs = existingDestinations.map((destination) => {
      return destination.slug;
    });

    return generateUniqueSlug(destinationName, existingSlugs);
  }

  private buildCreateDestinationData(
    dto: CreateDestinationDto,
    slug: string,
  ): Prisma.DestinationCreateInput {
    return {
      name: dto.name,
      slug,
      description: dto.description,
      city: dto.city,
      province: dto.province,
      category: dto.category,
      latitude: dto.latitude,
      longitude: dto.longitude,
      googlePlaceId: dto.googlePlaceId,
      googleMapsUrl: dto.googleMapsUrl,
      youtubeUrl: dto.youtubeUrl,
      thumbnailUrl: dto.thumbnailUrl,
      googleRating: dto.googleRating,
      googleReviewCount: dto.googleReviewCount,
    };
  }

  private isPrismaUniqueError(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }

  private throwDuplicateDestination(): never {
    throw new ConflictException('Destinasi dengan nama ini mungkin sudah ada');
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
    await this.assertDestinationExists(id);

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
        googlePlaceId: dto.googlePlaceId,
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
    await this.assertDestinationExists(id);

    return this.prisma.destination.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Memperbarui URL Google Maps destinasi.
  async updateMapsUrl(id: number, dto: UpdateMapsUrlDto) {
    await this.assertDestinationExists(id);

    return this.prisma.destination.update({
      where: { id },
      data: { googleMapsUrl: dto.googleMapsUrl },
    });
  }

  // Mengganti thumbnail destinasi dan menghapus file lokal lama.
  async uploadThumbnail(destinationId: number, filename: string) {
    const destination = await this.getDestinationOrCleanupUpload(
      destinationId,
      filename,
    );

    if (destination.thumbnailUrl?.startsWith('/uploads/')) {
      const oldFilename = path.basename(destination.thumbnailUrl);
      await this.removeFileIfExists(this.getDestinationUploadPath(oldFilename));
    }

    const thumbnailUrl = `/uploads/destinations/${filename}`;
    return this.prisma.destination.update({
      where: { id: destinationId },
      data: { thumbnailUrl },
    });
  }

  // Menambahkan satu gambar galeri destinasi.
  async uploadImage(destinationId: number, filename: string) {
    await this.getDestinationOrCleanupUpload(destinationId, filename);

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

  private async assertDestinationExists(id: number) {
    const destination = await this.prisma.destination.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!destination) {
      throw new NotFoundException('Destinasi tidak ditemukan');
    }
  }

  private async getDestinationOrCleanupUpload(
    destinationId: number,
    filename: string,
  ) {
    const destination = await this.prisma.destination.findUnique({
      where: { id: destinationId },
    });

    if (!destination) {
      await this.removeFileIfExists(this.getDestinationUploadPath(filename));
      throw new NotFoundException('Destinasi tidak ditemukan');
    }

    return destination;
  }

  private getDestinationUploadPath(filename: string) {
    // Multer menghasilkan filename, tetapi basename tetap dipakai agar path
    // dari luar tidak pernah dapat keluar dari folder upload destinasi.
    const safeFilename = path.basename(filename);
    return path.join(process.cwd(), 'uploads', 'destinations', safeFilename);
  }

  // Menghapus file lokal jika ada tanpa melempar error saat file hilang.
  private async removeFileIfExists(filepath: string): Promise<void> {
    await fs.rm(filepath, { force: true });
  }
}
