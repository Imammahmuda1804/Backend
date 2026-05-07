# Task 2.1 — Auth: Register & Login

> **Phase:** 2 - Authentication
> **Status:** ⬜ Belum Dimulai
> **Estimasi:** 3-4 jam
> **Dependencies:** Task 1.1, Task 1.2, Task 1.3

---

## Objective

Implementasi endpoint register dan login menggunakan JWT + Passport strategy.

---

## Endpoints

### POST /auth/register

Request:

```json
{
  "name": "John",
  "email": "john@mail.com",
  "password": "123456"
}
```

Response (201):

```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "John",
    "email": "john@mail.com",
    "role": "USER"
  }
}
```

Validasi:
- name: required, min 2 karakter
- email: required, valid email, unique
- password: required, min 6 karakter

Logic:
1. Check email unik
2. Hash password dengan bcrypt (salt rounds: 10)
3. Create user dengan role USER
4. Return user tanpa password

---

### POST /auth/login

Request:

```json
{
  "email": "john@mail.com",
  "password": "123456"
}
```

Response (200):

```json
{
  "status": "success",
  "data": {
    "access_token": "eyJhbG...",
    "refresh_token": "eyJhbG...",
    "user": {
      "id": 1,
      "name": "John",
      "role": "USER"
    }
  }
}
```

Logic:
1. Find user by email
2. Compare password dengan bcrypt
3. Generate access token (expiry: 15m)
4. Generate refresh token (expiry: 7d)
5. Return tokens + user info

---

## Steps

### 1. Buat Auth Module

```bash
nest g module modules/auth
nest g controller modules/auth
nest g service modules/auth
```

### 2. Buat JWT Strategy

Buat `src/modules/auth/strategies/jwt.strategy.ts`:

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
```

### 3. Buat DTOs

- `register.dto.ts` — RegisterDto
- `login.dto.ts` — LoginDto
- `auth-response.dto.ts` — AuthResponseDto

### 4. Implementasi Auth Service

- `register()` — hash password, create user
- `login()` — validate credentials, generate tokens
- `generateTokens()` — create access + refresh JWT

### 5. Implementasi Auth Controller

- `@Post('register')` — public
- `@Post('login')` — public

---

## Files yang Dibuat

```text
src/modules/auth/
├── auth.module.ts           (new)
├── auth.controller.ts       (new)
├── auth.service.ts          (new)
├── strategies/
│   └── jwt.strategy.ts      (new)
├── dto/
│   ├── register.dto.ts      (new)
│   ├── login.dto.ts         (new)
│   └── auth-response.dto.ts (new)
```

---

## Acceptance Criteria

- [ ] Register berhasil membuat user baru
- [ ] Register menolak email duplikat (409 Conflict)
- [ ] Register menolak input tidak valid (400 Bad Request)
- [ ] Password tersimpan sebagai hash (bukan plaintext)
- [ ] Login berhasil mengembalikan access_token dan refresh_token
- [ ] Login menolak credentials salah (401 Unauthorized)
- [ ] JWT token bisa diverifikasi
- [ ] Swagger documentation tersedia untuk kedua endpoint
