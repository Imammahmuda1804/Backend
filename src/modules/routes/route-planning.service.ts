import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { RouteStopInputDto } from './dto/route.dto';
import { calculateDistanceKm, hasCoordinate } from './route-distance.util';
import type { PreparedRouteStop } from './route.persistence';

type DestinationCoordinate = {
  id: number;
  name: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
};

@Injectable()
export class RoutePlanningService {
  constructor(private readonly prisma: PrismaService) {}

  async prepareStops(
    stops: RouteStopInputDto[],
    autoSort = false,
  ): Promise<PreparedRouteStop[]> {
    const destinationIds = this.getUniqueDestinationIds(stops);
    const destinations = await this.findDestinations(destinationIds);
    const destinationMap = new Map(
      destinations.map((destination) => [destination.id, destination]),
    );
    const orderedStops = autoSort
      ? this.sortByNearest(stops, destinationMap)
      : this.sortByRequestedOrder(stops);

    return orderedStops.map((stop, index) =>
      this.withDistances(stop, index, orderedStops, destinationMap),
    );
  }

  calculateRouteStats(stops: PreparedRouteStop[]) {
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

  deriveCity(stops: PreparedRouteStop[]) {
    return stops.find((stop) => stop.city)?.city || null;
  }

  toCreateInput(stops: PreparedRouteStop[]) {
    return stops.map((stop) => ({
      destinationId: stop.destinationId,
      stopOrder: stop.stopOrder,
      distanceFromPreviousKm: stop.distanceFromPreviousKm,
      distanceToNextKm: stop.distanceToNextKm,
      note: stop.note,
      estimatedVisitMinutes: stop.estimatedVisitMinutes,
    }));
  }

  private getUniqueDestinationIds(stops: RouteStopInputDto[]) {
    const destinationIds = [
      ...new Set(stops.map((stop) => stop.destinationId)),
    ];
    if (destinationIds.length !== stops.length) {
      throw new ForbiddenException(
        'Destinasi dalam route tidak boleh duplikat',
      );
    }
    return destinationIds;
  }

  private async findDestinations(destinationIds: number[]) {
    const destinations = await this.prisma.destination.findMany({
      where: { id: { in: destinationIds }, deletedAt: null },
      select: {
        id: true,
        name: true,
        city: true,
        latitude: true,
        longitude: true,
      },
    });

    if (destinations.length !== destinationIds.length) {
      throw new NotFoundException('Sebagian destinasi tidak ditemukan');
    }
    return destinations;
  }

  private sortByRequestedOrder(stops: RouteStopInputDto[]) {
    return [...stops].sort(
      (first, second) =>
        (first.stopOrder || stops.indexOf(first) + 1) -
        (second.stopOrder || stops.indexOf(second) + 1),
    );
  }

  private withDistances(
    stop: RouteStopInputDto,
    index: number,
    orderedStops: RouteStopInputDto[],
    destinations: Map<number, DestinationCoordinate>,
  ): PreparedRouteStop {
    const current = destinations.get(stop.destinationId)!;
    const previous = this.getNeighbor(orderedStops[index - 1], destinations);
    const next = this.getNeighbor(orderedStops[index + 1], destinations);

    return {
      ...stop,
      stopOrder: index + 1,
      city: current.city,
      distanceFromPreviousKm: this.distance(previous, current),
      distanceToNextKm: this.distance(current, next),
    };
  }

  private getNeighbor(
    stop: RouteStopInputDto | undefined,
    destinations: Map<number, DestinationCoordinate>,
  ) {
    return stop ? (destinations.get(stop.destinationId) ?? null) : null;
  }

  private distance(
    from: DestinationCoordinate | null,
    to: DestinationCoordinate | null,
  ) {
    return from && to ? calculateDistanceKm(from, to) : null;
  }

  private sortByNearest(
    stops: RouteStopInputDto[],
    destinations: Map<number, DestinationCoordinate>,
  ) {
    const withCoordinates = stops.filter((stop) =>
      hasCoordinate(destinations.get(stop.destinationId)!),
    );
    const withoutCoordinates = stops.filter(
      (stop) => !hasCoordinate(destinations.get(stop.destinationId)!),
    );
    if (withCoordinates.length <= 1) {
      return [...withCoordinates, ...withoutCoordinates];
    }

    return [
      ...this.buildNearestNeighborOrder(withCoordinates, destinations),
      ...withoutCoordinates,
    ];
  }

  private buildNearestNeighborOrder(
    stops: RouteStopInputDto[],
    destinations: Map<number, DestinationCoordinate>,
  ) {
    const sorted = [stops[0]];
    const remaining = stops.slice(1);

    while (remaining.length > 0) {
      const last = destinations.get(sorted.at(-1)!.destinationId)!;
      const nearestIndex = this.findNearestIndex(last, remaining, destinations);
      sorted.push(remaining.splice(nearestIndex, 1)[0]);
    }
    return sorted;
  }

  private findNearestIndex(
    origin: DestinationCoordinate,
    candidates: RouteStopInputDto[],
    destinations: Map<number, DestinationCoordinate>,
  ) {
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    candidates.forEach((candidate, index) => {
      const destination = destinations.get(candidate.destinationId)!;
      const distance =
        calculateDistanceKm(origin, destination) ?? Number.POSITIVE_INFINITY;
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });
    return nearestIndex;
  }
}
