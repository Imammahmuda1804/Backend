import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AutoSortRouteDto,
  CreateRouteDto,
  RouteVisibility,
  UpdateRouteDto,
} from './dto/route.dto';
import { RouteAccessService } from './route-access.service';
import { ROUTE_INCLUDE } from './route.persistence';
import { RoutePlanningService } from './route-planning.service';

@Injectable()
export class RouteManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly routeAccess: RouteAccessService,
    private readonly routePlanning: RoutePlanningService,
  ) {}

  async create(userId: number, dto: CreateRouteDto, isAdminCurated = false) {
    const stops = await this.routePlanning.prepareStops(
      dto.stops,
      dto.autoSort,
    );
    const stats = this.routePlanning.calculateRouteStats(stops);

    return this.prisma.route.create({
      data: {
        title: dto.title,
        description: dto.description,
        visibility: dto.visibility || (isAdminCurated ? 'public' : 'private'),
        city: dto.city || this.routePlanning.deriveCity(stops),
        isAdminCurated,
        shareSlug: await this.generateShareSlug(dto.title),
        createdByUserId: userId,
        ...stats,
        stops: { create: this.routePlanning.toCreateInput(stops) },
      },
      include: ROUTE_INCLUDE,
    });
  }

  async update(id: number, userId: number, dto: UpdateRouteDto) {
    const route = await this.routeAccess.getEditableRoute(id, userId);
    return this.updateRouteWithStops(
      route.id,
      dto,
      (dto.visibility || route.visibility) as RouteVisibility,
    );
  }

  async remove(id: number, userId: number, admin = false) {
    if (admin) await this.routeAccess.assertExists(id);
    else await this.routeAccess.getEditableRoute(id, userId);

    await this.prisma.route.delete({ where: { id } });
    return { message: 'Route dihapus' };
  }

  async save(userId: number, routeId: number) {
    const route = await this.routeAccess.findById(routeId, userId);
    if (route.visibility === 'private' && route.createdByUserId !== userId) {
      throw new NotFoundException('Route tidak ditemukan');
    }

    await this.prisma.savedRoute.upsert({
      where: { userId_routeId: { userId, routeId } },
      update: {},
      create: { userId, routeId },
    });
    return { message: 'Route disimpan' };
  }

  async unsave(userId: number, routeId: number) {
    await this.prisma.savedRoute.deleteMany({ where: { userId, routeId } });
    return { message: 'Route dihapus dari simpanan' };
  }

  async duplicate(userId: number, routeId: number) {
    const route = await this.routeAccess.findById(routeId, userId);
    return this.create(userId, {
      title: `${route.title} (Salinan)`,
      description: route.description || undefined,
      visibility: 'private',
      city: route.city || undefined,
      stops: route.stops.map((stop) => ({
        destinationId: stop.destinationId,
        stopOrder: stop.stopOrder,
        note: stop.note || undefined,
        estimatedVisitMinutes: stop.estimatedVisitMinutes || undefined,
      })),
    });
  }

  async autoSort(dto: AutoSortRouteDto) {
    const stops = await this.routePlanning.prepareStops(dto.stops, true);
    return {
      stops,
      ...this.routePlanning.calculateRouteStats(stops),
    };
  }

  async updateAdmin(id: number, dto: UpdateRouteDto) {
    await this.routeAccess.assertExists(id);
    return this.updateRouteWithStops(id, dto, dto.visibility || 'public', {
      isAdminCurated: true,
    });
  }

  async publishAdmin(id: number, visibility: RouteVisibility) {
    await this.routeAccess.assertExists(id);
    return this.prisma.route.update({
      where: { id },
      data: { visibility },
      include: ROUTE_INCLUDE,
    });
  }

  private async updateRouteWithStops(
    routeId: number,
    dto: UpdateRouteDto,
    visibility: RouteVisibility,
    extraData: Prisma.RouteUpdateInput = {},
  ) {
    const stops = await this.routePlanning.prepareStops(
      dto.stops,
      dto.autoSort,
    );
    const stats = this.routePlanning.calculateRouteStats(stops);
    const data: Prisma.RouteUpdateInput = {
      title: dto.title,
      description: dto.description,
      visibility,
      city: dto.city || this.routePlanning.deriveCity(stops),
      ...stats,
      stops: { create: this.routePlanning.toCreateInput(stops) },
      ...extraData,
    };

    return this.prisma.$transaction(async (transaction) => {
      await transaction.routeStop.deleteMany({ where: { routeId } });
      return transaction.route.update({
        where: { id: routeId },
        data,
        include: ROUTE_INCLUDE,
      });
    });
  }

  private async generateShareSlug(title: string) {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .slice(0, 56);

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const suffix = Math.random().toString(36).slice(2, 8);
      const shareSlug = `${base || 'route'}-${suffix}`;
      const exists = await this.prisma.route.findUnique({
        where: { shareSlug },
      });
      if (!exists) return shareSlug;
    }
    return `route-${Date.now()}`;
  }
}
