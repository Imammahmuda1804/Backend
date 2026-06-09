import { Module } from '@nestjs/common';
import { AdminRoutesController } from './admin-routes.controller';
import { RoutesController } from './routes.controller';
import { RoutesService } from './routes.service';
import { RouteAccessService } from './route-access.service';
import { RouteManagementService } from './route-management.service';
import { RoutePlanningService } from './route-planning.service';
import { RouteQueryService } from './route-query.service';
import { SavedRouteProgressService } from './saved-route-progress.service';

@Module({
  controllers: [RoutesController, AdminRoutesController],
  providers: [
    RoutesService,
    RouteAccessService,
    RouteQueryService,
    RoutePlanningService,
    RouteManagementService,
    SavedRouteProgressService,
  ],
  exports: [RoutesService],
})
export class RoutesModule {}
