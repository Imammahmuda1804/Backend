import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';
import { JwtPayload } from '../../common/interfaces';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly configService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    register(dto: RegisterDto): Promise<{
        name: string;
        email: string;
        id: number;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
    }>;
    login(dto: LoginDto): Promise<{
        user: {
            id: number;
            name: string;
            email: string;
            role: import("@prisma/client").$Enums.Role;
        };
        access_token: string;
        refresh_token: string;
    }>;
    generateTokens(payload: JwtPayload): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
}
