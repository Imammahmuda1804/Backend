import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
interface AuthenticatedUser {
    id: number;
    email: string;
    role: string;
}
declare const JwtAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class JwtAuthGuard extends JwtAuthGuard_base {
    private reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | import("rxjs").Observable<boolean>;
    handleRequest<TUser = AuthenticatedUser>(err: Error | null, user: TUser | false | null): TUser;
}
export {};
