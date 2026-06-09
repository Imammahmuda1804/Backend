import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { UpdateRouteProgressDto } from './dto/route.dto';
import { RouteAccessService } from './route-access.service';

@Injectable()
export class SavedRouteProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly routeAccess: RouteAccessService,
  ) {}

  async findProgress(userId: number, routeId: number) {
    const savedRoute = await this.routeAccess.getSavedRouteForUser(
      userId,
      routeId,
    );
    const progress = await this.prisma.savedRouteProgress.findMany({
      where: { savedRouteId: savedRoute.id },
      orderBy: { routeStop: { stopOrder: 'asc' } },
      include: { routeStop: true },
    });

    return { savedRouteId: savedRoute.id, routeId, progress };
  }

  async updateProgress(
    userId: number,
    routeId: number,
    routeStopId: number,
    dto: UpdateRouteProgressDto,
  ) {
    const savedRoute = await this.routeAccess.getSavedRouteForUser(
      userId,
      routeId,
    );
    await this.routeAccess.assertRouteStopBelongsToRoute(routeId, routeStopId);
    const visitedAt = dto.status === 'visited' ? new Date() : null;

    return this.prisma.savedRouteProgress.upsert({
      where: {
        savedRouteId_routeStopId: {
          savedRouteId: savedRoute.id,
          routeStopId,
        },
      },
      update: { status: dto.status, note: dto.note, visitedAt },
      create: {
        savedRouteId: savedRoute.id,
        routeStopId,
        status: dto.status,
        note: dto.note,
        visitedAt,
      },
      include: { routeStop: true },
    });
  }

  async resetProgress(userId: number, routeId: number, routeStopId: number) {
    const savedRoute = await this.routeAccess.getSavedRouteForUser(
      userId,
      routeId,
    );
    await this.routeAccess.assertRouteStopBelongsToRoute(routeId, routeStopId);
    await this.prisma.savedRouteProgress.deleteMany({
      where: { savedRouteId: savedRoute.id, routeStopId },
    });

    return { message: 'Progress route direset' };
  }
}
