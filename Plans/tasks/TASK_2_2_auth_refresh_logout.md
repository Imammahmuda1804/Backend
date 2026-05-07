# Task 2.2 — Auth: Refresh Token, Logout & JWT Guards

> **Phase:** 2 - Authentication
> **Status:** ⬜ Belum Dimulai
> **Estimasi:** 2-3 jam
> **Dependencies:** Task 2.1

---

## Objective

Implementasi refresh token, logout, dan aktivasi global JWT guard + role-based guard.

---

## Endpoints

### POST /auth/refresh

Request:

```json
{
  "refresh_token": "eyJhbG..."
}
```

Response (200):

```json
{
  "status": "success",
  "data": {
    "access_token": "new-eyJhbG...",
    "refresh_token": "new-eyJhbG..."
  }
}
```

Logic:
1. Verify refresh token menggunakan JWT_REFRESH_SECRET
2. Check user masih ada dan aktif
3. Generate token pair baru
4. Return new tokens

---

### POST /auth/logout

Request:

```json
{
  "refresh_token": "eyJhbG..."
}
```

Response (200):

```json
{
  "status": "success",
  "data": {
    "message": "Logged out successfully"
  }
}
```

Logic:
1. Verify refresh token
2. (Opsional) Simpan token ke blacklist di Redis
3. Return success message

---

## Steps

### 1. Tambah Refresh Token DTO

Buat `src/modules/auth/dto/refresh-token.dto.ts`

### 2. Implementasi di Auth Service

- `refreshToken()` — verify refresh, generate new pair
- `logout()` — invalidate token

### 3. Tambah Endpoint di Auth Controller

- `@Post('refresh')` — public (tidak perlu JWT guard)
- `@Post('logout')` — requires JWT guard

### 4. Aktivasi Global JWT Guard

Di `app.module.ts`, daftarkan global guard:

```typescript
providers: [
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  },
  {
    provide: APP_GUARD,
    useClass: RolesGuard,
  },
],
```

Setelah ini, **semua endpoint wajib memiliki JWT token** kecuali yang diberi decorator `@Public()`.

### 5. Tandai Public Endpoints

Tambahkan `@Public()` pada:
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`

---

## Files yang Dimodifikasi/Dibuat

```text
src/modules/auth/
├── auth.controller.ts       (modified — tambah refresh, logout)
├── auth.service.ts          (modified — tambah refreshToken, logout)
├── dto/
│   └── refresh-token.dto.ts (new)

src/app.module.ts             (modified — register global guards)
```

---

## Acceptance Criteria

- [ ] Refresh token mengembalikan token pair baru
- [ ] Refresh token menolak token invalid/expired (401)
- [ ] Logout mengembalikan success message
- [ ] Global JWT guard aktif — endpoint tanpa @Public() menolak request tanpa token
- [ ] @Public() endpoints tetap accessible tanpa token
- [ ] RolesGuard memblokir akses user biasa ke endpoint admin
