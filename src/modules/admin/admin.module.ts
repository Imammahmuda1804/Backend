import { Module } from '@nestjs/common';
import { AdminUsersController } from './admin-users.controller';
import { AdminModerationController } from './admin-moderation.controller';
import { UsersModule } from '../users/users.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  // AnalyticsModule diimport di sini agar AnalyticsService tersedia
  // untuk AdminModerationController. AnalyticsModule sudah export AnalyticsService.
  // NestJS menangani singleton per DI context — tidak ada double instantiation.
  imports: [UsersModule, ReviewsModule, AnalyticsModule],
  controllers: [AdminUsersController, AdminModerationController],
})
export class AdminModule { }
