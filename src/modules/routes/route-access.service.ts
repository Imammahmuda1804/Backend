import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ROUTE_INCLUDE } from './route.persistence';

@Injectable()
export class RouteAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number, userId?: number) {
    const route = await this.prisma.route.findUnique({
      where: { id },
      include: ROUTE_INCLUDE,
    });

    if (!route) throw new NotFoundException('Route tidak ditemukan');
    this.assertCanRead(route, userId);
    return route;
  }

  async findByShareSlug(shareSlug: string) {
    const route = await this.prisma.route.findUnique({
      where: { shareSlug },
      include: ROUTE_INCLUDE,
    });

    if (!route || route.visibility === 'private') {
      throw new NotFoundException('Route tidak ditemukan');
    }
    return route;
  }

  async getEditableRoute(id: number, userId: number) {
    const route = await this.assertExists(id);
    if (route.createdByUserId !== userId) {
      throw new ForbiddenException('Anda tidak bisa mengubah route ini');
    }
    return route;
  }

  async getSavedRouteForUser(userId: number, routeId: number) {
    const savedRoute = await this.prisma.savedRoute.findUnique({
      where: { userId_routeId: { userId, routeId } },
    });
    if (!savedRoute) {
      throw new NotFoundException('Route tersimpan tidak ditemukan');
    }
    return savedRoute;
  }

  async assertRouteStopBelongsToRoute(routeId: number, routeStopId: number) {
    const routeStop = await this.prisma.routeStop.findFirst({
      where: { id: routeStopId, routeId },
    });
    if (!routeStop) {
      throw new NotFoundException('Stop route tidak ditemukan');
    }
    return routeStop;
  }

  async assertExists(id: number) {
    const route = await this.prisma.route.findUnique({ where: { id } });
    if (!route) throw new NotFoundException('Route tidak ditemukan');
    return route;
  }

  private assertCanRead(
    route: { visibility: string; createdByUserId: number | null },
    userId?: number,
  ) {
    if (route.visibility !== 'private') return;
    if (userId && route.createdByUserId === userId) return;
    throw new NotFoundException('Route tidak ditemukan');
  }
}
