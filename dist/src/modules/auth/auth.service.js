"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const google_auth_library_1 = require("google-auth-library");
const prisma_service_1 = require("../../prisma/prisma.service");
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwtService;
    configService;
    logger = new common_1.Logger(AuthService_1.name);
    googleClient = new google_auth_library_1.OAuth2Client();
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async register(dto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email sudah terdaftar');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email,
                password: hashedPassword,
                profilePicture: dto.profilePicture,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                profilePicture: true,
                createdAt: true,
            },
        });
        this.logger.log(`User registered: ${user.email}`);
        return user;
    }
    async login(dto) {
        const user = await this.findPasswordLoginCandidate(dto.email);
        this.assertPasswordLoginAllowed(user);
        await this.assertPasswordMatches(dto.password, user.password);
        this.logger.log(`User logged in: ${user.email}`);
        return this.buildLoginResponse(user);
    }
    findPasswordLoginCandidate(email) {
        return this.prisma.user.findUnique({ where: { email } });
    }
    assertPasswordLoginAllowed(user) {
        if (!user?.password)
            this.throwInvalidPasswordLogin();
        this.assertActiveUser(user.status);
    }
    async assertPasswordMatches(plainPassword, hashedPassword) {
        const isPasswordValid = await bcrypt.compare(plainPassword, hashedPassword);
        if (!isPasswordValid)
            this.throwInvalidPasswordLogin();
    }
    throwInvalidPasswordLogin() {
        throw new common_1.UnauthorizedException('Email atau password salah');
    }
    async loginWithGoogle(dto) {
        const payload = await this.verifyGoogleToken(dto.id_token);
        const googleProfile = this.toVerifiedGoogleProfile(payload);
        const existingByGoogleId = await this.findUserByGoogleId(googleProfile.googleId);
        const user = existingByGoogleId ?? (await this.findOrCreateGoogleUser(googleProfile));
        this.assertActiveUser(user.status);
        this.logger.log(`User logged in with Google: ${user.email}`);
        return this.buildLoginResponse(user);
    }
    toVerifiedGoogleProfile(payload) {
        this.assertGooglePayloadVerified(payload);
        const email = payload.email.toLowerCase();
        return {
            googleId: payload.sub,
            email,
            name: this.resolveGoogleProfileName(payload, email),
            picture: payload.picture,
        };
    }
    assertGooglePayloadVerified(payload) {
        if (!payload.sub)
            this.throwInvalidGoogleAccount();
        if (!payload.email)
            this.throwInvalidGoogleAccount();
        if (payload.email_verified !== true)
            this.throwInvalidGoogleAccount();
    }
    resolveGoogleProfileName(payload, email) {
        return payload.name ?? email.split('@')[0];
    }
    throwInvalidGoogleAccount() {
        throw new common_1.UnauthorizedException('Akun Google tidak valid');
    }
    assertActiveUser(status) {
        if (status !== 'active') {
            throw new common_1.UnauthorizedException('Akun Anda telah dinonaktifkan');
        }
    }
    findUserByGoogleId(googleId) {
        return this.prisma.user.findUnique({ where: { googleId } });
    }
    async generateTokens(payload) {
        const tokenPayload = {
            sub: payload.sub,
            email: payload.email,
            role: payload.role,
        };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(tokenPayload, {
                secret: this.configService.get('JWT_SECRET'),
                expiresIn: this.configService.get('JWT_EXPIRATION') || '15m',
            }),
            this.jwtService.signAsync(tokenPayload, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
                expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION') || '7d',
            }),
        ]);
        return {
            access_token: accessToken,
            refresh_token: refreshToken,
        };
    }
    async refreshToken(dto) {
        try {
            const payload = await this.jwtService.verifyAsync(dto.refresh_token, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });
            if (!user || user.status !== 'active') {
                throw new common_1.UnauthorizedException('User tidak valid atau tidak aktif');
            }
            const tokens = await this.generateTokens({
                sub: user.id,
                email: user.email,
                role: user.role,
            });
            return tokens;
        }
        catch {
            throw new common_1.UnauthorizedException('Refresh token tidak valid atau sudah expired');
        }
    }
    async logout(dto) {
        try {
            await this.jwtService.verifyAsync(dto.refresh_token, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });
            return { message: 'Logged out successfully' };
        }
        catch {
            throw new common_1.UnauthorizedException('Refresh token tidak valid');
        }
    }
    async verifyGoogleToken(idToken) {
        const audience = this.getGoogleClientIds();
        this.assertGoogleLoginConfigured(audience);
        try {
            return await this.readGoogleTokenPayload(idToken, audience);
        }
        catch (error) {
            return this.rejectInvalidGoogleToken(error);
        }
    }
    assertGoogleLoginConfigured(audience) {
        if (audience.length > 0)
            return;
        this.logger.error('Google login client ID belum dikonfigurasi');
        throw new common_1.UnauthorizedException('Login Google belum dikonfigurasi');
    }
    async readGoogleTokenPayload(idToken, audience) {
        const ticket = await this.googleClient.verifyIdToken({ idToken, audience });
        const payload = ticket.getPayload();
        if (!payload)
            throw new common_1.UnauthorizedException('Token Google tidak valid');
        return payload;
    }
    rejectInvalidGoogleToken(error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Google token verification failed: ${message}`);
        throw new common_1.UnauthorizedException('Token Google tidak valid');
    }
    getGoogleClientIds() {
        const clientIds = this.configService.get('GOOGLE_CLIENT_IDS');
        const webClientId = this.configService.get('GOOGLE_WEB_CLIENT_ID');
        return [
            ...(clientIds?.split(',') ?? []),
            ...(webClientId ? [webClientId] : []),
        ]
            .map((clientId) => clientId.trim())
            .filter(Boolean);
    }
    async findOrCreateGoogleUser(input) {
        const existingByEmail = await this.prisma.user.findFirst({
            where: {
                email: {
                    equals: input.email,
                    mode: 'insensitive',
                },
            },
        });
        if (existingByEmail) {
            return this.prisma.user.update({
                where: { id: existingByEmail.id },
                data: {
                    googleId: input.googleId,
                    authProvider: existingByEmail.authProvider === 'local'
                        ? 'local_google'
                        : existingByEmail.authProvider,
                    emailVerified: true,
                    profilePicture: existingByEmail.profilePicture ?? input.picture,
                },
            });
        }
        return this.prisma.user.create({
            data: {
                name: input.name,
                email: input.email,
                password: null,
                googleId: input.googleId,
                authProvider: 'google',
                emailVerified: true,
                profilePicture: input.picture,
            },
        });
    }
    async buildLoginResponse(user) {
        const tokens = await this.generateTokens({
            sub: user.id,
            email: user.email,
            role: user.role,
        });
        return {
            ...tokens,
            user: this.toPublicAuthUser(user),
        };
    }
    toPublicAuthUser(user) {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            profilePicture: user.profilePicture,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map