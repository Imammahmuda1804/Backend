# Task 4.2 — Public Destinations (Recommendations, Detail, Ranking)

> **Phase:** 4 - Destinations
> **Status:** ⬜ Belum Dimulai
> **Estimasi:** 3-4 jam
> **Dependencies:** Task 4.1

---

## Objective

Implementasi public endpoint untuk user melihat destinasi: landing page recommendations, detail, dan ranking.

---

## Endpoints

### GET /destinations/recommendations

Landing page recommendation (public).

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
      "province": "Sumatera Barat",
      "thumbnail_url": "...",
      "google_rating": 4.5,
      "user_rating": 4.2,
      "positive_ratio": 0.85,
      "recommendation_score": 0.78
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 50, "total_pages": 5 }
}
```

Logic:
1. Query destinations yang memiliki analytics
2. Sort by `recommendation_score DESC`
3. Exclude soft-deleted
4. Return paginated

---

### GET /destinations/:id

Destination detail (public).

Response wajib mencakup:
- metadata (name, city, province, coordinates, dll)
- gallery images
- youtube trailer URL
- sentiment summary (positive_ratio)
- sentiment trend (chart data)
- topic insights (top topics)
- google rating + user rating
- recommendation score

Logic:
1. Find destination by ID (exclude soft-deleted)
2. Include: images, destination_topics (with topic), sentiment_trends
3. Aggregate: user_reviews rata-rata rating
4. Return assembled response

---

### GET /destinations/ranking

Top destinations berdasarkan berbagai metrik.

Query: `?sort_by=sentiment|recommendation|rating&limit=10`

Response: sorted list of destinations.

---

## Steps

### 1. Buat Public Destinations Controller

`src/modules/destinations/destinations.controller.ts`

Semua endpoint menggunakan `@Public()` decorator.

### 2. Implementasi di Destinations Service

- `findRecommendations()` — sorted by recommendation_score
- `findOnePublic()` — detail with all relations
- `findRanking()` — top destinations by chosen metric

### 3. Buat Response DTOs

- `destination-list.dto.ts` — list item (ringkas)
- `destination-detail.dto.ts` — detail lengkap

---

## Files yang Dimodifikasi/Dibuat

```text
src/modules/destinations/
├── destinations.controller.ts     (new — public endpoints)
├── destinations.service.ts        (modified — tambah findRecommendations, findOnePublic, findRanking)
├── dto/
│   ├── destination-list.dto.ts    (new)
│   └── destination-detail.dto.ts  (new)
```

---

## Acceptance Criteria

- [ ] GET /recommendations mengembalikan sorted by recommendation_score
- [ ] GET /recommendations mendukung pagination
- [ ] GET /recommendations accessible tanpa JWT (public)
- [ ] GET /:id mengembalikan detail lengkap (images, topics, trends, ratings)
- [ ] GET /:id return 404 untuk destination soft-deleted
- [ ] GET /ranking mendukung sort by sentiment/recommendation/rating
- [ ] Semua endpoint bisa diakses tanpa login
