# Task 9.3 — Topics (List & Filter)

> **Phase:** 9 - User Features
> **Status:** ✅ Selesai
> **Estimasi:** 1 jam
> **Dependencies:** Task 6.3

---

## Objective

Implementasi endpoint untuk melihat daftar topics dan filter destinations berdasarkan topic.

---

## Endpoints

### GET /topics

List semua topics.

Response (200):

```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "topic_name": "akses jalan",
      "keywords": ["jalan", "akses", "parkir"],
      "total_destinations": 15
    }
  ]
}
```

---

### GET /topics/:id/destinations

Filter destinations berdasarkan topic.

Query: `?page=1&limit=10`

Response (200):

```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "Jam Gadang",
      "slug": "jam-gadang",
      "city": "Bukittinggi",
      "thumbnail_url": "...",
      "total_reviews_in_topic": 45,
      "positive_ratio": 0.82
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 15, "total_pages": 2 }
}
```

---

## Steps

### 1. Buat Topics Module

```bash
nest g module modules/topics
nest g controller modules/topics
nest g service modules/topics
```

### 2. Implementasi Topics Service

- `findAll()` — list topics with destination count
- `findDestinationsByTopic()` — paginated destinations by topic

### 3. Implementasi Controller (Public)

- `@Get()` — `@Public()`
- `@Get(':id/destinations')` — `@Public()`

---

## Files yang Dibuat

```text
src/modules/topics/
├── topics.module.ts       (new)
├── topics.controller.ts   (new)
├── topics.service.ts      (new)
```

---

## Acceptance Criteria

- [ ] GET /topics mengembalikan semua topics
- [ ] Setiap topic menampilkan jumlah destinations terkait
- [ ] GET /topics/:id/destinations mengembalikan destinations yang punya topic tersebut
- [ ] Filter by topic mendukung pagination
- [ ] 404 untuk topic tidak ditemukan
- [ ] Kedua endpoint public (tanpa login)
