# Task 1.3 — Common Guards, Decorators, Filters

> **Phase:** 1 - Foundation & Setup
> **Status:** ⬜ Belum Dimulai
> **Estimasi:** 2-3 jam
> **Dependencies:** Task 1.1

---

## Objective

Membuat semua shared utilities yang akan dipakai di seluruh module: JWT guards, role guards, custom decorators, global exception filter, response interceptor, dan common DTOs.

---

## Steps

### 1. JWT Auth Guard

Buat `src/common/guards/jwt-auth.guard.ts`:

- Extend `AuthGuard('jwt')` dari `@nestjs/passport`
- Handle token expiration error

### 2. Role Guard

Buat `src/common/guards/roles.guard.ts`:

- Check user role dari JWT payload
- Bandingkan dengan required roles di decorator

### 3. Roles Decorator

Buat `src/common/decorators/roles.decorator.ts`:

```typescript
import { SetMetadata } from '@nestjs/common';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

### 4. Current User Decorator

Buat `src/common/decorators/current-user.decorator.ts`:

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

### 5. Public Decorator

Buat `src/common/decorators/public.decorator.ts`:

- Mark endpoint sebagai public (bypass JWT guard)

### 6. Global Exception Filter

Buat `src/common/filters/http-exception.filter.ts`:

Response format standar:

```json
{
  "statusCode": 400,
  "message": "Invalid request",
  "error": "Bad Request"
}
```

### 7. Response Transform Interceptor

Buat `src/common/interceptors/transform.interceptor.ts`:

Wrap semua response dengan format standar:

```json
{
  "status": "success",
  "data": { ... }
}
```

### 8. Common DTOs

Buat `src/common/dto/`:

- `pagination.dto.ts` — PaginationQueryDto (page, limit, sort, order)
- `paginated-response.dto.ts` — PaginatedResponseDto (data, meta)

```typescript
export class PaginationQueryDto {
  @IsOptional() @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @IsInt() @Min(1) @Max(100) limit?: number = 10;
  @IsOptional() @IsString() sort?: string;
  @IsOptional() @IsIn(['asc', 'desc']) order?: string = 'desc';
  @IsOptional() @IsString() search?: string;
}
```

### 9. Constants

Buat `src/common/constants/`:

- `roles.constant.ts` — Role enum values
- `pagination.constant.ts` — Default pagination values

### 10. Utility Functions

Buat `src/common/utils/`:

- `slug.util.ts` — Generate slug dari nama destinasi
- `pagination.util.ts` — Helper untuk menghitung offset, total_pages

---

## Files yang Dibuat

```text
src/common/
├── guards/
│   ├── jwt-auth.guard.ts        (new)
│   └── roles.guard.ts           (new)
├── decorators/
│   ├── roles.decorator.ts       (new)
│   ├── current-user.decorator.ts (new)
│   └── public.decorator.ts      (new)
├── filters/
│   └── http-exception.filter.ts (new)
├── interceptors/
│   └── transform.interceptor.ts (new)
├── dto/
│   ├── pagination.dto.ts        (new)
│   └── paginated-response.dto.ts (new)
├── constants/
│   ├── roles.constant.ts        (new)
│   └── pagination.constant.ts   (new)
├── utils/
│   ├── slug.util.ts             (new)
│   └── pagination.util.ts      (new)
└── interfaces/
    └── jwt-payload.interface.ts (new)
```

---

## Acceptance Criteria

- [ ] JwtAuthGuard bisa melindungi endpoint
- [ ] RolesGuard bisa membedakan ADMIN vs USER
- [ ] @CurrentUser() decorator mengembalikan user dari JWT
- [ ] @Public() decorator bypass JWT auth
- [ ] Exception filter mengembalikan format error standar
- [ ] PaginationQueryDto memvalidasi input pagination
- [ ] Transform interceptor wrap response ke format standar
