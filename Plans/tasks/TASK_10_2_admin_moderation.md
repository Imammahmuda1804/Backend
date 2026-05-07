# Task 10.2 — Admin Moderation & Recalculate

> **Phase:** 10 - Admin Dashboard & Polish
> **Status:** ⬜ Belum Dimulai
> **Estimasi:** 2 jam
> **Dependencies:** Task 8.2, Task 9.2

---

## Objective

Implementasi fitur moderasi admin: hapus review tidak pantas dan recalculate analytics.

---

## Endpoints

### DELETE /admin/reviews/:id

Hapus scraped review yang tidak pantas.

Response (200):

```json
{
  "status": "success",
  "data": { "message": "Review deleted" }
}
```

Logic:
1. Find review by ID
2. Delete review
3. Delete review embedding (cascade)
4. Recalculate destination sentiment stats

---

### DELETE /admin/user-reviews/:id

Hapus user review yang tidak pantas.

Response (200):

```json
{
  "status": "success",
  "data": { "message": "User review deleted" }
}
```

Logic:
1. Find user review by ID
2. Delete user review
3. Recalculate destination user_rating dan user_review_count

---

### POST /admin/analytics/recalculate/:destinationId

Recalculate semua analytics untuk destination.

Response (200):

```json
{
  "status": "success",
  "data": {
    "message": "Analytics recalculated",
    "destination_id": 1,
    "positive_ratio": 0.72,
    "recommendation_score": 0.80,
    "total_reviews": 480,
    "topics_count": 8
  }
}
```

Logic:
1. Recalculate sentiment distribution
2. Recalculate positive_ratio
3. Recalculate topic distribution (destination_topics)
4. Recalculate sentiment_trends
5. Recalculate recommendation_score
6. Update destination record

---

## Steps

### 1. Implementasi di Reviews Service

- `deleteReview()` — hard delete + cascade embedding
- `deleteUserReview()` — hard delete + recalculate rating

### 2. Implementasi di Analytics Service

- `recalculateAnalytics()` — full recalculation pipeline

### 3. Buat Admin Moderation Controller

- `@Delete('reviews/:id')` — `@Roles('ADMIN')`
- `@Delete('user-reviews/:id')` — `@Roles('ADMIN')`
- `@Post('analytics/recalculate/:destinationId')` — `@Roles('ADMIN')`

---

## Files yang Dimodifikasi/Dibuat

```text
src/modules/admin/
├── admin-moderation.controller.ts  (new)

src/modules/reviews/
├── reviews.service.ts              (modified — tambah delete methods)

src/modules/analytics/
├── analytics.service.ts            (modified — tambah recalculate)
```

---

## Acceptance Criteria

- [ ] DELETE /admin/reviews/:id berhasil hapus review + embedding
- [ ] DELETE /admin/user-reviews/:id berhasil hapus + recalculate rating
- [ ] POST /admin/analytics/recalculate berhasil recalculate semua metrics
- [ ] Setelah recalculate, positive_ratio dan recommendation_score terupdate
- [ ] Setelah recalculate, destination_topics terupdate
- [ ] 404 jika review/destination tidak ditemukan
- [ ] Semua endpoint hanya ADMIN
