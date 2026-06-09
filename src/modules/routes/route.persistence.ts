import { Prisma } from '@prisma/client';
import type { RouteStopInputDto } from './dto/route.dto';

export const ROUTE_INCLUDE = {
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

export type PreparedRouteStop = RouteStopInputDto & {
  stopOrder: number;
  city: string;
  distanceFromPreviousKm: number | null;
  distanceToNextKm: number | null;
};

export function getPagination(page: number, limit: number, maxLimit = 50) {
  const take = Math.min(limit, maxLimit);
  const skip = (Math.max(page, 1) - 1) * take;
  return { take, skip };
}

export function toPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
) {
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
