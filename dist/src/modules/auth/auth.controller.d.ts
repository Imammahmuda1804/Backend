import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, RegisterDto } from './dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
            role: import("@prisma/client").$Enums.Role;
            profilePicture: string | null;
        };
        access_token: string;
        refresh_token: string;
    }>;
    refresh(dto: RefreshTokenDto): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    logout(dto: RefreshTokenDto): Promise<{
        message: string;
    }>;
}
