# Task 8.1 — Analytics Dashboard

> **Phase:** 8 - Analytics
> **Status:** ✅ Selesai
> **Estimasi:** 2-3 jam
> **Dependencies:** Task 4.1, Task 6.3

---

## Objective

Implementasi analytics dashboard endpoint untuk public dan admin.

---

## Endpoints

### GET /analytics/dashboard (Public)

Dashboard analytics umum.

Response (200):

```json
{
  "status": "success",
  "data": {
    "total_destinations": 50,
    "total_reviews": 15000,
    "sentiment_distribution": {
      "positive": 8500,
      "negative": 3000,
      "neutral": 3500
    },
    "top_topics": [
      { "topic_name": "akses jalan", "count": 1200 },
      { "topic_name": "kebersihan", "count": 980 }
    ],
    "top_recommendations": [
      { "id": 1, "name": "Jam Gadang", "recommendation_score": 0.92 }
    ]
  }
}
```

---

### GET /admin/dashboard/summary (Admin)

Dashboard summary untuk admin.

Response (200):

```json
{
  "status": "success",
  "data": {
    "total_users": 200,
    "total_destinations": 50,
    "total_reviews": 15000,
    "total_scraping_jobs": 30,
    "sentiment_distribution": { ... },
    "top_destinations": [ ... ],
    "latest_scraping_jobs": [ ... ]
  }
}
```

---

### GET /admin/dashboard/activity (Admin)

Recent activity untuk admin dashboard.

Response: recent scraping, analytics, reviews, users.

---

### GET /admin/dashboard/trends (Admin)

Trend data: daily, weekly, monthly.

---

## Steps

### 1. Buat Analytics Module

```bash
nest g module modules/analytics
nest g controller modules/analytics
nest g service modules/analytics
```

### 2. Implementasi Analytics Service

- `getPublicDashboard()` — aggregate public stats
- `getAdminSummary()` — aggregate admin stats
- `getAdminActivity()` — recent activity list
- `getAdminTrends()` — daily/weekly/monthly trend aggregation

### 3. Buat Controllers

- `analytics.controller.ts` — public endpoints (`@Public()`)
- `admin-analytics.controller.ts` — admin endpoints (`@Roles('ADMIN')`)

---

## Files yang Dibuat

```text
src/modules/analytics/
├── analytics.module.ts               (new)
├── analytics.controller.ts           (new — public)
├── admin-analytics.controller.ts     (new — admin)
├── analytics.service.ts              (new)
```

---

## Acceptance Criteria

- [ ] GET /analytics/dashboard mengembalikan public stats
- [ ] GET /analytics/dashboard accessible tanpa login
- [ ] GET /admin/dashboard/summary mengembalikan admin stats
- [ ] GET /admin/dashboard/activity mengembalikan recent activities
- [ ] GET /admin/dashboard/trends mengembalikan trend data
- [ ] Admin endpoints hanya bisa diakses ADMIN
- [ ] Aggregate queries performant (menggunakan COUNT, SUM, GROUP BY)
