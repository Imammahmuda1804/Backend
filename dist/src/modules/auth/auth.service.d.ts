import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto, RefreshTokenDto, GoogleLoginDto } from './dto';
import { JwtPayload } from '../../common/interfaces';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly configService;
    private readonly logger;
    private readonly googleClient;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    register(dto: RegisterDto): Promise<{
        id: number;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        profilePicture: string | null;
        createdAt: Date;
    }>;
    login(dto: LoginDto): Promise<{
        user: {
            id: number;
            name: string;
            email: string;
            role: string;
            profilePicture: string | null;
        };
        access_token: string;
        refresh_token: string;
    }>;
    private findPasswordLoginCandidate;
    private assertPasswordLoginAllowed;
    private assertPasswordMatches;
    private throwInvalidPasswordLogin;
    loginWithGoogle(dto: GoogleLoginDto): Promise<{
        user: {
            id: number;
            name: string;
            email: string;
            role: string;
            profilePicture: string | null;
        };
        access_token: string;
        refresh_token: string;
    }>;
    private toVerifiedGoogleProfile;
    private assertGooglePayloadVerified;
    private resolveGoogleProfileName;
    private throwInvalidGoogleAccount;
    private assertActiveUser;
    private findUserByGoogleId;
    generateTokens(payload: JwtPayload): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    refreshToken(dto: RefreshTokenDto): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    logout(dto: RefreshTokenDto): Promise<{
        message: string;
    }>;
    private verifyGoogleToken;
    private assertGoogleLoginConfigured;
    private readGoogleTokenPayload;
    private rejectInvalidGoogleToken;
    private getGoogleClientIds;
    private findOrCreateGoogleUser;
    private buildLoginResponse;
    private toPublicAuthUser;
}
