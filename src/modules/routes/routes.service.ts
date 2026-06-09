import { Injectable } from '@nestjs/common';
import type {
  AutoSortRouteDto,
  CreateRouteDto,
  RouteVisibility,
  UpdateRouteDto,
  UpdateRouteProgressDto,
} from './dto/route.dto';
import { RouteAccessService } from './route-access.service';
import { RouteManagementService } from './route-management.service';
import { RouteQueryService } from './route-query.service';
import { SavedRouteProgressService } from './saved-route-progress.service';

/**
 * Facade route yang menjaga controller tetap sederhana dan kompatibel.
 * Implementasi detail berada pada provider sesuai tanggung jawabnya.
 */
@Injectable()
export class RoutesService {
  constructor(
    private readonly queryService: RouteQueryService,
    private readonly accessService: RouteAccessService,
    private readonly progressService: SavedRouteProgressService,
    private readonly managementService: RouteManagementService,
  ) {}

  findPublic(page = 1, limit = 12, city?: string) {
    return this.queryService.findPublic(page, limit, city);
  }

  findMine(userId: number, page = 1, limit = 20) {
    return this.queryService.findMine(userId, page, limit);
  }

  findSaved(userId: number, page = 1, limit = 20) {
    return this.queryService.findSaved(userId, page, limit);
  }

  findSavedProgress(userId: number, routeId: number) {
    return this.progressService.findProgress(userId, routeId);
  }

  updateSavedProgress(
    userId: number,
    routeId: number,
    routeStopId: number,
    dto: UpdateRouteProgressDto,
  ) {
    return this.progressService.updateProgress(
      userId,
      routeId,
      routeStopId,
      dto,
    );
  }

  resetSavedProgress(userId: number, routeId: number, routeStopId: number) {
    return this.progressService.resetProgress(userId, routeId, routeStopId);
  }

  findById(id: number, userId?: number) {
    return this.accessService.findById(id, userId);
  }

  findByShareSlug(shareSlug: string) {
    return this.accessService.findByShareSlug(shareSlug);
  }

  create(userId: number, dto: CreateRouteDto, isAdminCurated = false) {
    return this.managementService.create(userId, dto, isAdminCurated);
  }

  update(id: number, userId: number, dto: UpdateRouteDto) {
    return this.managementService.update(id, userId, dto);
  }

  remove(id: number, userId: number, admin = false) {
    return this.managementService.remove(id, userId, admin);
  }

  save(userId: number, routeId: number) {
    return this.managementService.save(userId, routeId);
  }

  unsave(userId: number, routeId: number) {
    return this.managementService.unsave(userId, routeId);
  }

  duplicate(userId: number, routeId: number) {
    return this.managementService.duplicate(userId, routeId);
  }

  autoSort(dto: AutoSortRouteDto) {
    return this.managementService.autoSort(dto);
  }

  findAdmin(page = 1, limit = 20) {
    return this.queryService.findAdmin(page, limit);
  }

  updateAdmin(id: number, dto: UpdateRouteDto) {
    return this.managementService.updateAdmin(id, dto);
  }

  publishAdmin(id: number, visibility: RouteVisibility) {
    return this.managementService.publishAdmin(id, visibility);
  }
}
