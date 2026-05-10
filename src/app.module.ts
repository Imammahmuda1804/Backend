import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { envConfig } from './config/env.config';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AdminModule } from './modules/admin/admin.module';
import { DestinationsModule } from './modules/destinations/destinations.module';
import { ScraperModule } from './modules/scraper/scraper.module';
import { NlpModule } from './modules/nlp/nlp.module';
import { VectorModule } from './modules/vector/vector.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { SearchModule } from './modules/search/search.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { TopicsModule } from './modules/topics/topics.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    // Global Configuration
    ConfigModule.forRoot(envConfig),

    // Database (Global)
    PrismaModule,

    // Authentication
    AuthModule,

    // User Management
    UsersModule,

    // Admin Module
    AdminModule,

    // Destinations Module
    DestinationsModule,

    // Scraper Module
    ScraperModule,

    // NLP Module
    NlpModule,

    // Vector Module
    VectorModule,

    // Uploads Module
    UploadsModule,

    // Search Module
    SearchModule,

    // Analytics Module
    AnalyticsModule,

    // Favorites Module
    FavoritesModule,

    // User Reviews Module
    ReviewsModule,

    // Topics Module
    TopicsModule,

    // Static Files
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),

    // Rate Limiting
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000, // 1 minute
          limit: 60, // 60 requests per minute
        },
      ],
    }),

    // BullMQ Queue (Redis)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule { }
