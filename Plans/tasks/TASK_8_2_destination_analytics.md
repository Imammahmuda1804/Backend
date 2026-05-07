# Task 8.2 — Destination Analytics & Topics

> **Phase:** 8 - Analytics
> **Status:** ⬜ Belum Dimulai
> **Estimasi:** 2-3 jam
> **Dependencies:** Task 8.1

---

## Objective

Implementasi analytics per destinasi: sentiment distribution, topic distribution, dan trend chart data.

---

## Endpoints

### GET /analytics/destination/:id

Analytics lengkap untuk satu destination.

Response (200):

```json
{
  "status": "success",
  "data": {
    "destination_id": 1,
    "destination_name": "Jam Gadang",
    "total_reviews": 500,
    "sentiment_distribution": {
      "positive": 350,
      "negative": 80,
      "neutral": 70
    },
    "average_rating": 4.3,
    "positive_ratio": 0.70,
    "recommendation_score": 0.78
  }
}
```

---

### GET /analytics/destination/:id/topics

Topic distribution untuk satu destination.

Response (200):

```json
{
  "status": "success",
  "data": {
    "topics": [
      { "topic_name": "akses jalan", "total_reviews": 120, "percentage": 34 },
      { "topic_name": "kebersihan", "total_reviews": 85, "percentage": 24 }
    ]
  }
}
```

---

### GET /analytics/trends/:id

Trend sentimen untuk satu destination.

Query: `?period=daily|weekly|monthly`

Response (200):

```json
{
  "status": "success",
  "data": {
    "trends": [
      {
        "date": "2026-01-01",
        "positive": 15,
        "negative": 3,
        "neutral": 5
      }
    ]
  }
}
```

---

## Steps

### 1. Implementasi di Analytics Service

- `getDestinationAnalytics()` — sentiment distribution, rating avg
- `getDestinationTopics()` — topic distribution with percentages
- `getDestinationTrends()` — sentiment trends (daily/weekly/monthly)

### 2. Tambah di Analytics Controller (public)

- `@Get('destination/:id')` — `@Public()`
- `@Get('destination/:id/topics')` — `@Public()`
- `@Get('trends/:id')` — `@Public()`

---

## Files yang Dimodifikasi

```text
src/modules/analytics/
├── analytics.controller.ts   (modified — tambah 3 endpoints)
├── analytics.service.ts      (modified — tambah 3 methods)
```

---

## Acceptance Criteria

- [ ] GET /analytics/destination/:id mengembalikan sentiment distribution
- [ ] GET /analytics/destination/:id/topics mengembalikan topic distribution
- [ ] Topic distribution menampilkan percentage
- [ ] GET /analytics/trends/:id mendukung daily/weekly/monthly
- [ ] Trends digroup berdasarkan period yang diminta
- [ ] 404 untuk destination tidak ditemukan
- [ ] Semua endpoint public (accessible tanpa login)
