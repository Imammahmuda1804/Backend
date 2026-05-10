# Task 7.2 — Search History (GET, DELETE)

> **Phase:** 7 - Semantic Search
> **Status:** ✅ Selesai
> **Estimasi:** 1 jam
> **Dependencies:** Task 7.1

---

## Objective

Implementasi endpoint untuk melihat dan menghapus riwayat pencarian user.

---

## Endpoints

### GET /search/history

Riwayat pencarian user (requires login).

Response (200):

```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "keyword": "wisata keluarga murah",
      "created_at": "2026-01-01T10:00:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 5, "total_pages": 1 }
}
```

---

### DELETE /search/history

Hapus semua riwayat pencarian user.

Response (200):

```json
{
  "status": "success",
  "data": { "message": "Search history cleared", "deleted_count": 5 }
}
```

---

### DELETE /search/history/:id

Hapus satu entry riwayat pencarian.

Response (200):

```json
{
  "status": "success",
  "data": { "message": "Search history entry deleted" }
}
```

---

## Steps

### 1. Implementasi di Search Service

- `getHistory()` — paginated search history for user
- `clearHistory()` — delete all history for user
- `deleteHistoryEntry()` — delete one entry (validate ownership)

### 2. Tambah di Search Controller

- `@Get('history')` — requires JWT
- `@Delete('history')` — requires JWT
- `@Delete('history/:id')` — requires JWT

---

## Files yang Dimodifikasi

```text
src/modules/search/
├── search.controller.ts   (modified — tambah 3 endpoints)
├── search.service.ts      (modified — tambah history methods)
```

---

## Acceptance Criteria

- [ ] GET /search/history mengembalikan riwayat milik user yang login
- [ ] GET /search/history tidak mengembalikan riwayat user lain
- [ ] DELETE /search/history menghapus semua riwayat user
- [ ] DELETE /search/history/:id menghapus satu entry
- [ ] DELETE /search/history/:id menolak jika entry bukan milik user (403)
- [ ] Semua endpoint require JWT (401 tanpa token)
