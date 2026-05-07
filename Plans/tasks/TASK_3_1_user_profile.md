# Task 3.1 — User Profile (GET/PUT /users/me)

> **Phase:** 3 - User Management
> **Status:** ⬜ Belum Dimulai
> **Estimasi:** 1-2 jam
> **Dependencies:** Task 2.1, Task 2.2

---

## Objective

Implementasi endpoint profil user untuk melihat dan mengupdate data diri.

---

## Endpoints

### GET /users/me

Response (200):

```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "John",
    "email": "john@mail.com",
    "role": "USER",
    "created_at": "2026-01-01T00:00:00Z"
  }
}
```

Logic:
1. Ambil user ID dari JWT token (@CurrentUser)
2. Query user dari database
3. Return user tanpa password

---

### PUT /users/me

Request:

```json
{
  "name": "John Updated",
  "email": "newemail@mail.com",
  "password": "newpassword123"
}
```

Response (200):

```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "John Updated",
    "email": "newemail@mail.com",
    "role": "USER"
  }
}
```

Validasi:
- name: optional, min 2 karakter
- email: optional, valid email, unique
- password: optional, min 6 karakter (akan di-hash)

Logic:
1. Ambil user ID dari JWT token
2. Validate unique email (jika diubah)
3. Hash password baru (jika ada)
4. Update user
5. Return updated user tanpa password

---

## Steps

### 1. Buat Users Module

```bash
nest g module modules/users
nest g controller modules/users
nest g service modules/users
```

### 2. Buat DTOs

- `update-profile.dto.ts` — UpdateProfileDto (all fields optional)
- `user-response.dto.ts` — UserResponseDto (exclude password)

### 3. Implementasi Users Service

- `findById()` — find user by ID
- `findByEmail()` — find user by email (untuk auth juga)
- `updateProfile()` — update user data

### 4. Implementasi Users Controller

- `@Get('me')` — `@UseGuards(JwtAuthGuard)`
- `@Put('me')` — `@UseGuards(JwtAuthGuard)`

---

## Files yang Dibuat

```text
src/modules/users/
├── users.module.ts           (new)
├── users.controller.ts       (new)
├── users.service.ts          (new)
├── dto/
│   ├── update-profile.dto.ts (new)
│   └── user-response.dto.ts  (new)
```

---

## Acceptance Criteria

- [ ] GET /users/me mengembalikan profil user yang sedang login
- [ ] GET /users/me tidak mengembalikan field password
- [ ] PUT /users/me berhasil mengupdate name
- [ ] PUT /users/me berhasil mengupdate email (check unique)
- [ ] PUT /users/me berhasil mengupdate password (stored as hash)
- [ ] PUT /users/me menolak email duplikat (409)
- [ ] Kedua endpoint menolak request tanpa JWT token (401)
