# Task 8.3 — Comparison, Trends & Export

> **Phase:** 8 - Analytics
> **Status:** ✅ Selesai
> **Estimasi:** 2-3 jam
> **Dependencies:** Task 8.2

---

## Objective

Implementasi perbandingan dua destination dan export analytics CSV.

---

## Endpoints

### GET /analytics/compare

Perbandingan dua destination.

Query: `?destination1=1&destination2=2`

Response (200):

```json
{
  "status": "success",
  "data": {
    "destination1": {
      "id": 1,
      "name": "Jam Gadang",
      "sentiment": { "positive": 350, "negative": 80, "neutral": 70 },
      "topics": [ ... ],
      "rating": { "google": 4.6, "user": 4.3 },
      "recommendation_score": 0.82,
      "positive_ratio": 0.70
    },
    "destination2": {
      "id": 2,
      "name": "Ngarai Sianok",
      "sentiment": { "positive": 280, "negative": 50, "neutral": 40 },
      "topics": [ ... ],
      "rating": { "google": 4.7, "user": 4.5 },
      "recommendation_score": 0.88,
      "positive_ratio": 0.76
    },
    "comparison": {
      "sentiment_winner": 2,
      "rating_winner": 2,
      "recommendation_winner": 2,
      "score_difference": 0.06
    }
  }
}
```

---

### GET /admin/analytics/export/:destinationId

Export analytics destination sebagai CSV.

Response: File CSV download

Headers:
```text
Content-Type: text/csv
Content-Disposition: attachment; filename="analytics_jam_gadang.csv"
```

CSV berisi:
- Review text, sentiment, topic, rating, date
- Summary statistics di header

---

## Steps

### 1. Implementasi di Analytics Service

- `compareDestinations()` — compare two destinations
- `exportAnalyticsCsv()` — generate CSV from analytics data

### 2. Tambah di Controllers

- `@Get('compare')` — `@Public()` di analytics.controller.ts
- `@Get('export/:destinationId')` — `@Roles('ADMIN')` di admin-analytics.controller.ts

### 3. Buat DTOs

- `compare-query.dto.ts` — CompareQueryDto (destination1, destination2 required)

---

## Files yang Dimodifikasi

```text
src/modules/analytics/
├── analytics.controller.ts           (modified — tambah compare)
├── admin-analytics.controller.ts     (modified — tambah export)
├── analytics.service.ts              (modified — tambah compare, export)
├── dto/
│   └── compare-query.dto.ts          (new)
```

---

## Acceptance Criteria

- [ ] GET /analytics/compare mengembalikan perbandingan 2 destinations
- [ ] Comparison mencakup: sentiment, topic, rating, recommendation score
- [ ] Comparison menunjukkan "winner" per kategori
- [ ] 400 jika destination1 atau destination2 tidak ada
- [ ] GET /admin/analytics/export/:destinationId mendownload CSV
- [ ] CSV berisi review data lengkap dengan sentiment dan topic
- [ ] Export endpoint hanya bisa diakses ADMIN
