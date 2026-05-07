# Task 3.2 — Admin User Management

> **Phase:** 3 - User Management
> **Status:** ⬜ Belum Dimulai
> **Estimasi:** 2-3 jam
> **Dependencies:** Task 3.1

---

## Objective

Implementasi CRUD endpoint user untuk admin, termasuk list, detail, edit, dan soft delete/suspend.

---

## Endpoints

### GET /admin/users

List semua user dengan pagination dan search.

Query: `?page=1&limit=10&search=john`

Response (200):

```json
{
  "status": "success",
  "data": [
    { "id": 1, "name": "John", "email": "john@mail.com", "role": "USER", "status": "active" }
  ],
  "meta": { "page": 1, "limit": 10, "total": 50, "total_pages": 5 }
}
```

---

### GET /admin/users/:id

Detail user beserta favorites, reviews, dan search history.

Response (200):

```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "John",
    "email": "john@mail.com",
    "role": "USER",
    "status": "active",
    "favorites": [...],
    "reviews": [...],
    "search_history": [...]
  }
}
```

---

### PUT /admin/users/:id

Edit user oleh admin.

Request:

```json
{
  "name": "John Updated",
  "email": "john@mail.com",
  "role": "ADMIN",
  "status": "suspended"
}
```

---

### DELETE /admin/users/:id

Soft delete / suspend user.

Logic:
1. Set status ke "suspended"
2. Jangan hapus data dari database

---

## Steps

### 1. Buat Admin Module (jika belum ada)

```bash
nest g module modules/admin
nest g controller modules/admin
```

### 2. Buat DTOs

- `admin-user-query.dto.ts` — extends PaginationQueryDto
- `admin-update-user.dto.ts` — AdminUpdateUserDto

### 3. Implementasi di Users Service

- `findAll()` — paginated list with search
- `findOneWithRelations()` — detail with favorites, reviews, search history
- `adminUpdate()` — update name, email, role, status
- `softDelete()` — set status to suspended

### 4. Implementasi Admin Controller Routes

Semua endpoint menggunakan:
- `@UseGuards(JwtAuthGuard, RolesGuard)`
- `@Roles('ADMIN')`

---

## Files yang Dimodifikasi/Dibuat

```text
src/modules/admin/
├── admin.module.ts               (new atau modified)
├── admin-users.controller.ts     (new)

src/modules/users/
├── users.service.ts              (modified — tambah findAll, adminUpdate, softDelete)
├── dto/
│   ├── admin-user-query.dto.ts   (new)
│   └── admin-update-user.dto.ts  (new)
```

---

## Acceptance Criteria

- [ ] GET /admin/users mengembalikan paginated user list
- [ ] GET /admin/users mendukung search by name/email
- [ ] GET /admin/users/:id mengembalikan detail user dengan relasi
- [ ] PUT /admin/users/:id berhasil mengubah role dan status
- [ ] DELETE /admin/users/:id men-suspend user (soft delete)
- [ ] Semua endpoint menolak akses dari role USER (403)
- [ ] Semua endpoint menolak request tanpa JWT (401)
