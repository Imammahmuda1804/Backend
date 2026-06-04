import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AutoSortRouteDto,
  CreateRouteDto,
  RouteStopInputDto,
  RouteVisibility,
  UpdateRouteProgressDto,
  UpdateRouteDto,
} from './dto/route.dto';
import { calculateDistanceKm, hasCoordinate } from './route-distance.util';

const ROUTE_INCLUDE = {
  createdBy: { select: { id: true, name: true, profilePicture: true } },
  stops: {
    orderBy: { stopOrder: 'asc' as const },
    include: {
      destination: {
        select: {
          id: true,
          name: true,
          slug: true,
          city: true,
          province: true,
          category: true,
          thumbnailUrl: true,
          googleRating: true,
          positiveRatio: true,
          recommendationScore: true,
          latitude: true,
          longitude: true,
          googlePlaceId: true,
          googleMapsUrl: true,
        },
      },
    },
  },
  savedRoutes: { select: { id: true, userId: true } },
} satisfies Prisma.RouteInclude;

@Injectable()
export class RoutesService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublic(page = 1, limit = 12, city?: string) {
    const take = Math.min(limit, 50);
    const skip = (Math.max(page, 1) - 1) * take;
    const where: Prisma.RouteWhereInput = {
      visibility: 'public',
      ...(city ? { city } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.route.findMany({
        where,
        skip,
        take,
        orderBy: [{ isAdminCurated: 'desc' }, { updatedAt: 'desc' }],
        include: ROUTE_INCLUDE,
      }),
      this.prisma.route.count({ where }),
    ]);

    return this.paginated(data, total, page, take);
  }

  async findMine(userId: number, page = 1, limit = 20) {
    const take = Math.min(limit, 50);
    const skip = (Math.max(page, 1) - 1) * take;

    const [data, total] = await Promise.all([
      this.prisma.route.findMany({
        where: { createdByUserId: userId },
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
        include: ROUTE_INCLUDE,
      }),
      this.prisma.route.count({ where: { createdByUserId: userId } }),
    ]);

    return this.paginated(data, total, page, take);
  }

  async findSaved(userId: number, page = 1, limit = 20) {
    const take = Math.min(limit, 50);
    const skip = (Math.max(page, 1) - 1) * take;

    const [data, total] = await Promise.all([
      this.prisma.savedRoute.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { route: { include: ROUTE_INCLUDE } },
      }),
      this.prisma.savedRoute.count({ where: { userId } }),
    ]);

    return this.paginated(
      data.map((item) => item.route),
      total,
      page,
      take,
    );
  }

  async findSavedProgress(userId: number, routeId: number) {
    const savedRoute = await this.getSavedRouteForUser(userId, routeId);
    const progress = await this.prisma.savedRouteProgress.findMany({
      where: { savedRouteId: savedRoute.id },
      orderBy: { routeStop: { stopOrder: 'asc' } },
      include: { routeStop: true },
    });

    return {
      savedRouteId: savedRoute.id,
      routeId,
      progress,
    };
  }

  async updateSavedProgress(
    userId: number,
    routeId: number,
    routeStopId: number,
    dto: UpdateRouteProgressDto,
  ) {
    const savedRoute = await this.getSavedRouteForUser(userId, routeId);
    await this.assertRouteStopBelongsToRoute(routeId, routeStopId);

    return this.prisma.savedRouteProgress.upsert({
      where: {
        savedRouteId_routeStopId: {
          savedRouteId: savedRoute.id,
          routeStopId,
        },
      },
      update: {
        status: dto.status,
        note: dto.note,
        visitedAt: dto.status === 'visited' ? new Date() : null,
      },
      create: {
        savedRouteId: savedRoute.id,
        routeStopId,
        status: dto.status,
        note: dto.note,
        visitedAt: dto.status === 'visited' ? new Date() : null,
      },
      include: { routeStop: true },
    });
  }

  async resetSavedProgress(
    userId: number,
    routeId: number,
    routeStopId: number,
  ) {
    const savedRoute = await this.getSavedRouteForUser(userId, routeId);
    await this.assertRouteStopBelongsToRoute(routeId, routeStopId);
    await this.prisma.savedRouteProgress.deleteMany({
      where: { savedRouteId: savedRoute.id, routeStopId },
    });
    return { message: 'Progress route direset' };
  }

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

  async create(userId: number, dto: CreateRouteDto, isAdminCurated = false) {
    const normalizedStops = await this.prepareStops(dto.stops, dto.autoSort);
    const stats = this.calculateRouteStats(normalizedStops);

    return this.prisma.route.create({
      data: {
        title: dto.title,
        description: dto.description,
        visibility: dto.visibility || (isAdminCurated ? 'public' : 'private'),
        city: dto.city || this.deriveCity(normalizedStops),
        isAdminCurated,
        shareSlug: await this.generateShareSlug(dto.title),
        createdByUserId: userId,
        totalDistanceKm: stats.totalDistanceKm,
        estimatedDurationMinutes: stats.estimatedDurationMinutes,
        stops: {
          create: normalizedStops.map((stop) => ({
            destinationId: stop.destinationId,
            stopOrder: stop.stopOrder,
            distanceFromPreviousKm: stop.distanceFromPreviousKm,
            distanceToNextKm: stop.distanceToNextKm,
            note: stop.note,
            estimatedVisitMinutes: stop.estimatedVisitMinutes,
          })),
        },
      },
      include: ROUTE_INCLUDE,
    });
  }

  async update(id: number, userId: number, dto: UpdateRouteDto) {
    const route = await this.getEditableRoute(id, userId);
    const normalizedStops = await this.prepareStops(dto.stops, dto.autoSort);
    const stats = this.calculateRouteStats(normalizedStops);

    return this.prisma.$transaction(async (tx) => {
      await tx.routeStop.deleteMany({ where: { routeId: route.id } });
      return tx.route.update({
        where: { id: route.id },
        data: {
          title: dto.title,
          description: dto.description,
          visibility: dto.visibility || route.visibility,
          city: dto.city || this.deriveCity(normalizedStops),
          totalDistanceKm: stats.totalDistanceKm,
          estimatedDurationMinutes: stats.estimatedDurationMinutes,
          stops: {
            create: normalizedStops.map((stop) => ({
              destinationId: stop.destinationId,
              stopOrder: stop.stopOrder,
              distanceFromPreviousKm: stop.distanceFromPreviousKm,
              distanceToNextKm: stop.distanceToNextKm,
              note: stop.note,
              estimatedVisitMinutes: stop.estimatedVisitMinutes,
            })),
          },
        },
        include: ROUTE_INCLUDE,
      });
    });
  }

  async remove(id: number, userId: number, admin = false) {
    if (!admin) await this.getEditableRoute(id, userId);
    else await this.assertExists(id);

    await this.prisma.route.delete({ where: { id } });
    return { message: 'Route dihapus' };
  }

  async save(userId: number, routeId: number) {
    const route = await this.findById(routeId, userId);
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
    const route = await this.findById(routeId, userId);
    const stops = route.stops.map((stop) => ({
      destinationId: stop.destinationId,
      stopOrder: stop.stopOrder,
      note: stop.note || undefined,
      estimatedVisitMinutes: stop.estimatedVisitMinutes || undefined,
    }));

    return this.create(userId, {
      title: `${route.title} (Salinan)`,
      description: route.description || undefined,
      visibility: 'private',
      city: route.city || undefined,
      stops,
    });
  }

  async autoSort(dto: AutoSortRouteDto) {
    const stops = await this.prepareStops(dto.stops, true);
    const stats = this.calculateRouteStats(stops);
    return {
      stops,
      ...stats,
    };
  }

  async findAdmin(page = 1, limit = 20) {
    const take = Math.min(limit, 100);
    const skip = (Math.max(page, 1) - 1) * take;

    const [data, total] = await Promise.all([
      this.prisma.route.findMany({
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
        include: ROUTE_INCLUDE,
      }),
      this.prisma.route.count(),
    ]);

    return this.paginated(data, total, page, take);
  }

  async updateAdmin(id: number, dto: UpdateRouteDto) {
    await this.assertExists(id);
    const normalizedStops = await this.prepareStops(dto.stops, dto.autoSort);
    const stats = this.calculateRouteStats(normalizedStops);

    return this.prisma.$transaction(async (tx) => {
      await tx.routeStop.deleteMany({ where: { routeId: id } });
      return tx.route.update({
        where: { id },
        data: {
          title: dto.title,
          description: dto.description,
          visibility: dto.visibility || 'public',
          city: dto.city || this.deriveCity(normalizedStops),
          isAdminCurated: true,
          totalDistanceKm: stats.totalDistanceKm,
          estimatedDurationMinutes: stats.estimatedDurationMinutes,
          stops: {
            create: normalizedStops.map((stop) => ({
              destinationId: stop.destinationId,
              stopOrder: stop.stopOrder,
              distanceFromPreviousKm: stop.distanceFromPreviousKm,
              distanceToNextKm: stop.distanceToNextKm,
              note: stop.note,
              estimatedVisitMinutes: stop.estimatedVisitMinutes,
            })),
          },
        },
        include: ROUTE_INCLUDE,
      });
    });
  }

  async publishAdmin(id: number, visibility: RouteVisibility) {
    await this.assertExists(id);
    return this.prisma.route.update({
      where: { id },
      data: { visibility },
      include: ROUTE_INCLUDE,
    });
  }

  private async prepareStops(stops: RouteStopInputDto[], autoSort = false) {
    const uniqueIds = [...new Set(stops.map((stop) => stop.destinationId))];
    if (uniqueIds.length !== stops.length) {
      throw new ForbiddenException(
        'Destinasi dalam route tidak boleh duplikat',
      );
    }

    const destinations = await this.prisma.destination.findMany({
      where: { id: { in: uniqueIds }, deletedAt: null },
      select: {
        id: true,
        name: true,
        city: true,
        latitude: true,
        longitude: true,
      },
    });

    if (destinations.length !== uniqueIds.length) {
      throw new NotFoundException('Sebagian destinasi tidak ditemukan');
    }

    const destinationMap = new Map(destinations.map((item) => [item.id, item]));
    const ordered = autoSort
      ? this.sortByNearest(stops, destinationMap)
      : [...stops].sort(
          (a, b) =>
            (a.stopOrder || stops.indexOf(a) + 1) -
            (b.stopOrder || stops.indexOf(b) + 1),
        );

    return ordered.map((stop, index) => {
      const current = destinationMap.get(stop.destinationId)!;
      const previous =
        index > 0
          ? destinationMap.get(ordered[index - 1].destinationId)!
          : null;
      const next =
        index < ordered.length - 1
          ? destinationMap.get(ordered[index + 1].destinationId)!
          : null;

      return {
        ...stop,
        stopOrder: index + 1,
        city: current.city,
        distanceFromPreviousKm: previous
          ? calculateDistanceKm(previous, current)
          : null,
        distanceToNextKm: next ? calculateDistanceKm(current, next) : null,
      };
    });
  }

  private sortByNearest(
    stops: RouteStopInputDto[],
    destinationMap: Map<
      number,
      { id: number; latitude: number | null; longitude: number | null }
    >,
  ) {
    const withCoordinates = stops.filter((stop) =>
      hasCoordinate(destinationMap.get(stop.destinationId)!),
    );
    const withoutCoordinates = stops.filter(
      (stop) => !hasCoordinate(destinationMap.get(stop.destinationId)!),
    );

    if (withCoordinates.length <= 1)
      return [...withCoordinates, ...withoutCoordinates];

    const sorted: RouteStopInputDto[] = [withCoordinates[0]];
    const remaining = withCoordinates.slice(1);

    while (remaining.length > 0) {
      const lastDestination = destinationMap.get(
        sorted[sorted.length - 1].destinationId,
      )!;
      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;

      remaining.forEach((candidate, index) => {
        const candidateDestination = destinationMap.get(
          candidate.destinationId,
        )!;
        const distance =
          calculateDistanceKm(lastDestination, candidateDestination) ??
          Number.POSITIVE_INFINITY;
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      sorted.push(remaining.splice(nearestIndex, 1)[0]);
    }

    return [...sorted, ...withoutCoordinates];
  }

  private calculateRouteStats(
    stops: Array<{
      distanceToNextKm: number | null;
      estimatedVisitMinutes?: number;
    }>,
  ) {
    const totalDistanceKm = stops.reduce(
      (sum, stop) => sum + (stop.distanceToNextKm || 0),
      0,
    );
    const visitMinutes = stops.reduce(
      (sum, stop) => sum + (stop.estimatedVisitMinutes || 90),
      0,
    );
    const travelMinutes = Math.round(totalDistanceKm * 3);

    return {
      totalDistanceKm: Math.round(totalDistanceKm * 100) / 100,
      estimatedDurationMinutes: visitMinutes + travelMinutes,
    };
  }

  private deriveCity(stops: Array<{ city?: string | null }>) {
    const firstCity = stops.find((stop) => stop.city)?.city;
    return firstCity || null;
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

  private async getEditableRoute(id: number, userId: number) {
    const route = await this.prisma.route.findUnique({ where: { id } });
    if (!route) throw new NotFoundException('Route tidak ditemukan');
    if (route.createdByUserId !== userId) {
      throw new ForbiddenException('Anda tidak bisa mengubah route ini');
    }
    return route;
  }

  private async getSavedRouteForUser(userId: number, routeId: number) {
    const savedRoute = await this.prisma.savedRoute.findUnique({
      where: { userId_routeId: { userId, routeId } },
    });
    if (!savedRoute) {
      throw new NotFoundException('Route tersimpan tidak ditemukan');
    }
    return savedRoute;
  }

  private async assertRouteStopBelongsToRoute(
    routeId: number,
    routeStopId: number,
  ) {
    const routeStop = await this.prisma.routeStop.findFirst({
      where: { id: routeStopId, routeId },
    });
    if (!routeStop) {
      throw new NotFoundException('Stop route tidak ditemukan');
    }
    return routeStop;
  }

  private async assertExists(id: number) {
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

  private paginated<T>(data: T[], total: number, page: number, limit: number) {
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
}
