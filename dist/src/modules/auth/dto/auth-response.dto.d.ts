export declare class AuthUserDto {
    id: number;
    name: string;
    email: string;
    role: string;
}
export declare class LoginResponseDto {
    access_token: string;
    refresh_token: string;
    user: AuthUserDto;
}
export declare class RegisterResponseDto {
    id: number;
    name: string;
    email: string;
    role: string;
}
