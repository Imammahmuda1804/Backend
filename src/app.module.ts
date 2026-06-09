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
import { RoutesModule } from './modules/routes/routes.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    // Memuat konfigurasi global.
    ConfigModule.forRoot(envConfig),

    // Memuat koneksi database.
    PrismaModule,

    // Mengaktifkan autentikasi.
    AuthModule,

    // Memuat fitur user.
    UsersModule,

    // Memuat fitur admin.
    AdminModule,

    // Memuat fitur destinasi.
    DestinationsModule,

    // Memuat fitur scraper.
    ScraperModule,

    // Memuat fitur NLP.
    NlpModule,

    // Memuat fitur vector search.
    VectorModule,

    // Memuat fitur upload.
    UploadsModule,

    // Memuat fitur search.
    SearchModule,

    // Memuat fitur analytics.
    AnalyticsModule,

    // Memuat fitur favorit.
    FavoritesModule,

    // Memuat fitur review user.
    ReviewsModule,

    // Memuat fitur topik.
    TopicsModule,

    // Memuat fitur rute wisata.
    RoutesModule,

    // Menyajikan file statis.
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),

    // Mengatur batas request.
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000, // 1 minute
          limit: 60, // 60 requests per minute
        },
      ],
    }),

    // Mengatur queue Redis.
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        const redisUsername = configService.get<string>('REDIS_USERNAME');
        const redisPassword = configService.get<string>('REDIS_PASSWORD');
        const useRedisTls =
          configService.get<string>('REDIS_TLS', 'false') === 'true';

        if (redisUrl) {
          const parsedRedisUrl = new URL(redisUrl);
          const protocolUsesTls = parsedRedisUrl.protocol === 'rediss:';

          return {
            connection: {
              host: parsedRedisUrl.hostname,
              port: Number(parsedRedisUrl.port || 6379),
              username: decodeURIComponent(parsedRedisUrl.username || ''),
              password: decodeURIComponent(parsedRedisUrl.password || ''),
              tls: protocolUsesTls ? {} : undefined,
              maxRetriesPerRequest: null,
              enableReadyCheck: false,
            },
          };
        }

        return {
          connection: {
            host: configService.get<string>('REDIS_HOST', 'localhost'),
            port: configService.get<number>('REDIS_PORT', 6379),
            username: redisUsername || undefined,
            password: redisPassword || undefined,
            tls: useRedisTls ? {} : undefined,
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
          },
        };
      },
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
// Menggabungkan semua module backend dan guard global aplikasi.
export class AppModule {}
