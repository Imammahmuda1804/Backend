"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const bullmq_1 = require("@nestjs/bullmq");
const env_config_1 = require("./config/env.config");
const prisma_module_1 = require("./prisma/prisma.module");
const app_controller_1 = require("./app.controller");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const admin_module_1 = require("./modules/admin/admin.module");
const destinations_module_1 = require("./modules/destinations/destinations.module");
const scraper_module_1 = require("./modules/scraper/scraper.module");
const nlp_module_1 = require("./modules/nlp/nlp.module");
const vector_module_1 = require("./modules/vector/vector.module");
const uploads_module_1 = require("./modules/uploads/uploads.module");
const search_module_1 = require("./modules/search/search.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
const favorites_module_1 = require("./modules/favorites/favorites.module");
const reviews_module_1 = require("./modules/reviews/reviews.module");
const topics_module_1 = require("./modules/topics/topics.module");
const routes_module_1 = require("./modules/routes/routes.module");
const core_1 = require("@nestjs/core");
const jwt_auth_guard_1 = require("./common/guards/jwt-auth.guard");
const roles_guard_1 = require("./common/guards/roles.guard");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot(env_config_1.envConfig),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            admin_module_1.AdminModule,
            destinations_module_1.DestinationsModule,
            scraper_module_1.ScraperModule,
            nlp_module_1.NlpModule,
            vector_module_1.VectorModule,
            uploads_module_1.UploadsModule,
            search_module_1.SearchModule,
            analytics_module_1.AnalyticsModule,
            favorites_module_1.FavoritesModule,
            reviews_module_1.ReviewsModule,
            topics_module_1.TopicsModule,
            routes_module_1.RoutesModule,
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(process.cwd(), 'uploads'),
                serveRoot: '/uploads',
            }),
            throttler_1.ThrottlerModule.forRoot({
                throttlers: [
                    {
                        ttl: 60000,
                        limit: 60,
                    },
                ],
            }),
            bullmq_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => {
                    const redisUrl = configService.get('REDIS_URL');
                    const redisUsername = configService.get('REDIS_USERNAME');
                    const redisPassword = configService.get('REDIS_PASSWORD');
                    const useRedisTls = configService.get('REDIS_TLS', 'false') === 'true';
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
                            host: configService.get('REDIS_HOST', 'localhost'),
                            port: configService.get('REDIS_PORT', 6379),
                            username: redisUsername || undefined,
                            password: redisPassword || undefined,
                            tls: useRedisTls ? {} : undefined,
                            maxRetriesPerRequest: null,
                            enableReadyCheck: false,
                        },
                    };
                },
                inject: [config_1.ConfigService],
            }),
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: roles_guard_1.RolesGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map