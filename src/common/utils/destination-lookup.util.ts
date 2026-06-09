import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Mengambil identitas destinasi aktif atau menghentikan proses dengan 404.
 *
 * Helper ini dipakai pada fitur yang hanya perlu memastikan bahwa destinasi
 * masih tersedia, tanpa memuat seluruh kolom destinasi.
 */
export async function findActiveDestinationIdentity(
  prisma: PrismaService,
  destinationId: number,
) {
  const destination = await prisma.destination.findFirst({
    where: { id: destinationId, deletedAt: null },
    select: { id: true, name: true },
  });

  if (!destination) {
    throw new NotFoundException('Destinasi tidak ditemukan');
  }

  return destination;
}
