# Task 9.1 — Favorites (Save, List, Delete)

> **Phase:** 9 - User Features
> **Status:** ⬜ Belum Dimulai
> **Estimasi:** 1-2 jam
> **Dependencies:** Task 2.2, Task 4.1

---

## Objective

Implementasi fitur simpan destinasi favorit/wishlist untuk user.

---

## Endpoints

### POST /favorites/:destinationId

Save destination ke favorites.

Response (201):

```json
{
  "status": "success",
  "data": { "message": "Destination saved to favorites" }
}
```

Logic:
1. Check destination exists
2. Check belum di-favorite (upsert/ignore)
3. Create favorite record

---

### GET /favorites

Get saved destinations.

Response (200):

```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "destination": {
        "id": 1,
        "name": "Jam Gadang",
        "slug": "jam-gadang",
        "city": "Bukittinggi",
        "thumbnail_url": "...",
        "recommendation_score": 0.82
      },
      "created_at": "2026-01-01T10:00:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 3, "total_pages": 1 }
}
```

---

### DELETE /favorites/:destinationId

Hapus dari favorites.

Response (200):

```json
{
  "status": "success",
  "data": { "message": "Destination removed from favorites" }
}
```

---

## Steps

### 1. Buat Favorites Module

```bash
nest g module modules/favorites
nest g controller modules/favorites
nest g service modules/favorites
```

### 2. Implementasi Favorites Service

- `addFavorite()` — create, handle duplicate
- `getFavorites()` — paginated list with destination data
- `removeFavorite()` — delete by userId + destinationId

### 3. Implementasi Controller

Semua endpoint require JWT.

---

## Files yang Dibuat

```text
src/modules/favorites/
├── favorites.module.ts       (new)
├── favorites.controller.ts   (new)
├── favorites.service.ts      (new)
```

---

## Acceptance Criteria

- [ ] POST berhasil menyimpan destination ke favorites
- [ ] POST handle duplicate gracefully (tidak error, return success)
- [ ] GET mengembalikan list favorites dengan destination data
- [ ] GET mendukung pagination
- [ ] DELETE berhasil menghapus dari favorites
- [ ] User hanya bisa lihat/kelola favorites miliknya sendiri
- [ ] Semua endpoint require JWT (401 tanpa token)
