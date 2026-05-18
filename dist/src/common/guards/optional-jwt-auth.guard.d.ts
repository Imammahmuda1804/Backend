import { ExecutionContext } from '@nestjs/common';
interface AuthenticatedUser {
    id: number;
    email: string;
    role: string;
}
declare const OptionalJwtAuthGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class OptionalJwtAuthGuard extends OptionalJwtAuthGuard_base {
    canActivate(context: ExecutionContext): Promise<boolean>;
    handleRequest<TUser = AuthenticatedUser | undefined>(_err: Error | null, user: TUser | false | null): TUser;
}
export {};
