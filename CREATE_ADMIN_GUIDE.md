# Cara Membuat Admin User

Ada 2 cara untuk membuat admin user:

## Cara 1: Via Swagger UI + Database Update (Recommended)

### Step 1: Register User Baru via Swagger

1. Buka Swagger UI: http://localhost:3000/api/docs
2. Cari endpoint **POST /api/auth/register**
3. Klik "Try it out"
4. Isi data:
```json
{
  "name": "Admin User",
  "email": "admin@wisata.com",
  "password": "admin123"
}
```
5. Klik "Execute"
6. User akan dibuat dengan role "USER" secara default

### Step 2: Update Role ke ADMIN via Database

**Menggunakan Docker:**
```bash
# Masuk ke container PostgreSQL
docker exec -it wisata_db psql -U postgres -d wisata_db

# Update role user menjadi ADMIN
UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@wisata.com';

# Verifikasi
SELECT id, name, email, role FROM "User" WHERE email = 'admin@wisata.com';

# Keluar
\q
```

### Step 3: Login sebagai Admin

1. Di Swagger UI, cari endpoint **POST /api/auth/login**
2. Klik "Try it out"
3. Isi credentials:
```json
{
  "email": "admin@wisata.com",
  "password": "admin123"
}
```
4. Klik "Execute"
5. Copy `access_token` dari response

### Step 4: Authorize di Swagger

1. Klik tombol **"Authorize"** di pojok kanan atas Swagger UI
2. Paste token dengan format: `Bearer <access_token>`
3. Klik "Authorize"
4. Sekarang Anda bisa mengakses semua endpoint admin!

---

## Cara 2: Via SQL Direct (Cepat)

```bash
# Masuk ke PostgreSQL container
docker exec -it wisata_db psql -U postgres -d wisata_db

# Buat admin user langsung (password: admin123)
INSERT INTO "User" (name, email, password, role, "createdAt", "updatedAt")
VALUES (
  'Admin User',
  'admin@wisata.com',
  '$2b$10$YourHashedPasswordHere',
  'ADMIN',
  NOW(),
  NOW()
);
```

**Note:** Password harus di-hash dengan bcrypt. Lebih mudah gunakan Cara 1.

---

## Cara 3: Via Prisma Studio (Visual)

```bash
# Buka Prisma Studio
npx prisma studio

# Browser akan terbuka di http://localhost:5555
# 1. Klik model "User"
# 2. Klik "Add record"
# 3. Isi data (password harus di-hash)
# 4. Save
```

---

## Verifikasi Admin User

### Via Database:
```sql
SELECT id, name, email, role FROM "User" WHERE role = 'ADMIN';
```

### Via API:
```bash
# Login
POST http://localhost:3000/api/auth/login
{
  "email": "admin@wisata.com",
  "password": "admin123"
}

# Test admin endpoint
GET http://localhost:3000/api/admin/users
Authorization: Bearer <access_token>
```

---

## Troubleshooting

### Error 403 "Forbidden resource"

**Penyebab:**
- User tidak memiliki role ADMIN
- Token tidak valid
- Token expired

**Solusi:**
1. Pastikan user memiliki role ADMIN di database
2. Login ulang untuk mendapatkan token baru
3. Pastikan format token: `Bearer <token>`

### Error 401 "Unauthorized"

**Penyebab:**
- Tidak ada token di header
- Token format salah
- Token expired

**Solusi:**
1. Login untuk mendapatkan token
2. Klik "Authorize" di Swagger UI
3. Paste token dengan format yang benar

---

## Quick Commands

### Check Docker Containers:
```bash
docker ps
```

### Access PostgreSQL:
```bash
docker exec -it wisata_db psql -U postgres -d wisata_db
```

### View Users:
```sql
SELECT id, name, email, role FROM "User";
```

### Update User Role:
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your@email.com';
```

---

## Default Admin Credentials (After Setup)

```
Email: admin@wisata.com
Password: admin123
Role: ADMIN
```

**⚠️ PENTING:** Ganti password setelah login pertama kali!

---

## Testing Admin Endpoints

Setelah login sebagai admin, Anda bisa test endpoint berikut:

### User Management:
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/:id` - User detail
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Suspend user

### Destination Management:
- `POST /api/admin/destinations` - Create destination
- `GET /api/admin/destinations` - List destinations
- `PUT /api/admin/destinations/:id` - Update destination
- `DELETE /api/admin/destinations/:id` - Delete destination

### Scraper:
- `GET /api/admin/scraper/search` - Search Google Maps
- `POST /api/admin/scraper/start` - Start scraping
- `GET /api/admin/scraper/jobs` - List jobs

### Analytics:
- `GET /api/admin/dashboard/summary` - Dashboard summary
- `GET /api/admin/dashboard/activity` - Recent activity
- `GET /api/admin/analytics/export/:id` - Export CSV

---

**Last Updated:** 2026-05-08
