# Task 4.1 — Admin Destination CRUD

> **Phase:** 4 - Destinations
> **Status:** ⬜ Belum Dimulai
> **Estimasi:** 3-4 jam
> **Dependencies:** Task 1.2, Task 2.2

---

## Objective

Implementasi CRUD endpoint destinasi wisata untuk admin.

---

## Endpoints

### POST /admin/destinations

Membuat destination baru.

Request:

```json
{
  "name": "Jam Gadang",
  "description": "Ikon wisata Bukittinggi",
  "city": "Bukittinggi",
  "province": "Sumatera Barat",
  "latitude": -0.305,
  "longitude": 100.369,
  "google_maps_url": "https://maps.google.com/...",
  "youtube_url": "https://youtube.com/...",
  "thumbnail_url": "https://..."
}
```

Logic:

1. Validate input
2. Generate slug dari name (e.g., "jam-gadang")
3. Check slug unik
4. Create destination
5. Return created destination

---

### GET /admin/destinations

List semua destination (admin dashboard).

Query: `?page=1&limit=10&search=jam`

Response termasuk: metadata, analytics summary (jika ada).

---

### GET /admin/destinations/:id

Detail destination untuk admin.

Response mencakup:

- metadata lengkap
- images
- analytics summary
- scraping history
- sentiment summary
- topic summary

---

### PUT /admin/destinations/:id

Edit destination.

Editable fields: name, description, city, province, coordinates, google_maps_url, youtube_url, thumbnail_url

---

### DELETE /admin/destinations/:id

Soft delete destination (set `deleted_at`).

---

### PUT /admin/destinations/:id/maps-url

Update Google Maps URL saja.

---

## Steps

### 1. Buat Destinations Module

```bash
nest g module modules/destinations
nest g service modules/destinations
```

### 2. Buat DTOs

- `create-destination.dto.ts`
- `update-destination.dto.ts`
- `destination-query.dto.ts` (extends PaginationQueryDto)
- `update-maps-url.dto.ts`

### 3. Implementasi Destinations Service

- `create()` — create with slug generation
- `findAll()` — paginated, with search, exclude soft-deleted
- `findOneAdmin()` — detail with relations (images, analytics, scraping)
- `update()` — partial update
- `softDelete()` — set deleted_at
- `updateMapsUrl()` — update google_maps_url only

### 4. Buat Admin Destinations Controller

Semua menggunakan `@Roles('ADMIN')`

---

## Files yang Dibuat

```text
src/modules/destinations/
├── destinations.module.ts            (new)
├── destinations.service.ts           (new)
├── admin-destinations.controller.ts  (new)
├── dto/
│   ├── create-destination.dto.ts     (new)
│   ├── update-destination.dto.ts     (new)
│   ├── destination-query.dto.ts      (new)
│   └── update-maps-url.dto.ts        (new)
```

---

## Acceptance Criteria

- [ ] POST berhasil membuat destination dengan slug auto-generate
- [ ] POST menolak nama duplikat slug (409)
- [ ] GET list mengembalikan paginated results
- [ ] GET list mendukung search by name/city
- [ ] GET list mengexclude soft-deleted destinations
- [ ] GET detail mengembalikan data lengkap dengan relasi
- [ ] PUT berhasil mengupdate field
- [ ] DELETE melakukan soft delete (set deleted_at, bukan hapus row)
- [ ] Semua endpoint hanya bisa diakses ADMIN
