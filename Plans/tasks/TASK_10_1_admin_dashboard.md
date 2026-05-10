# Task 10.1 — Admin Dashboard (Summary, Activity, Trends)

> **Phase:** 10 - Admin Dashboard & Polish
> **Status:** ✅ Selesai
> **Estimasi:** 2-3 jam
> **Dependencies:** Task 8.1

---

## Objective

Finalisasi admin dashboard endpoints dan pastikan semua aggregation query optimal.

---

## Endpoints (Review & Finalize)

### GET /admin/dashboard/summary

Sudah didefinisikan di Task 8.1. Pastikan response mencakup:

- total users (active, suspended)
- total destinations (active, deleted)
- total reviews (scraped + user)
- total scraping jobs (by status)
- sentiment distribution global
- top 5 destinations by recommendation_score
- latest 5 scraping jobs

---

### GET /admin/dashboard/activity

Sudah didefinisikan di Task 8.1. Pastikan response mencakup:

- 10 recent scraping jobs
- 10 recent NLP processing results
- 10 recent user reviews
- 10 recent user registrations

---

### GET /admin/dashboard/trends

Sudah didefinisikan di Task 8.1. Pastikan response mencakup:

- Daily: review count per day (last 30 days)
- Weekly: review count per week (last 12 weeks)
- Monthly: review count per month (last 12 months)
- Sentiment trends per period

---

## Steps

### 1. Review & Optimize Aggregation Queries

Pastikan semua queries menggunakan:
- Database-level aggregation (COUNT, SUM, AVG, GROUP BY)
- Tidak melakukan aggregation di application level
- Index yang tepat untuk kolom yang sering diquery

### 2. Tambah Database Indexes (jika belum)

```prisma
// Di schema.prisma
model Review {
  ...
  @@index([destinationId])
  @@index([sentiment])
  @@index([createdAt])
}

model SentimentTrend {
  ...
  @@index([destinationId, date])
}
```

### 3. Response Caching (Opsional)

Pertimbangkan caching untuk dashboard summary:
- Cache response selama 5 menit
- Invalidate setelah NLP processing selesai

---

## Files yang Dimodifikasi

```text
src/modules/analytics/
├── admin-analytics.controller.ts  (review & finalize)
├── analytics.service.ts           (review & optimize)

prisma/
├── schema.prisma                  (tambah indexes)
```

---

## Acceptance Criteria

- [ ] Dashboard summary menampilkan data akurat
- [ ] Activity feed menampilkan 10 item terbaru per kategori
- [ ] Trends menampilkan data 30 hari / 12 minggu / 12 bulan
- [ ] Query performance < 500ms
- [ ] Database indexes ditambahkan untuk kolom aggregation
