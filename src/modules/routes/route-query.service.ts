import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  getPagination,
  ROUTE_INCLUDE,
  toPaginatedResponse,
} from './route.persistence';

@Injectable()
export class RouteQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublic(page = 1, limit = 12, city?: string) {
    const { take, skip } = getPagination(page, limit);
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

    return toPaginatedResponse(data, total, page, take);
  }

  async findMine(userId: number, page = 1, limit = 20) {
    const { take, skip } = getPagination(page, limit);
    const where = { createdByUserId: userId };
    const [data, total] = await Promise.all([
      this.prisma.route.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
        include: ROUTE_INCLUDE,
      }),
      this.prisma.route.count({ where }),
    ]);

    return toPaginatedResponse(data, total, page, take);
  }

  async findSaved(userId: number, page = 1, limit = 20) {
    const { take, skip } = getPagination(page, limit);
    const [savedRoutes, total] = await Promise.all([
      this.prisma.savedRoute.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { route: { include: ROUTE_INCLUDE } },
      }),
      this.prisma.savedRoute.count({ where: { userId } }),
    ]);

    return toPaginatedResponse(
      savedRoutes.map((item) => item.route),
      total,
      page,
      take,
    );
  }

  async findAdmin(page = 1, limit = 20) {
    const { take, skip } = getPagination(page, limit, 100);
    const [data, total] = await Promise.all([
      this.prisma.route.findMany({
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
        include: ROUTE_INCLUDE,
      }),
      this.prisma.route.count(),
    ]);

    return toPaginatedResponse(data, total, page, take);
  }
}
