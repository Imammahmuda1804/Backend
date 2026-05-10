# Task 9.2 — User Reviews & Rating

> **Phase:** 9 - User Features
> **Status:** ✅ Selesai
> **Estimasi:** 1-2 jam
> **Dependencies:** Task 2.2, Task 4.1

---

## Objective

Implementasi fitur user memberikan rating dan review untuk destinasi.

---

## Endpoints

### POST /user-reviews

Buat review dan rating baru.

Request:

```json
{
  "destination_id": 1,
  "rating": 5,
  "review_text": "Tempatnya bagus dan bersih"
}
```

Response (201):

```json
{
  "status": "success",
  "data": {
    "id": 1,
    "destination_id": 1,
    "rating": 5,
    "review_text": "Tempatnya bagus dan bersih",
    "created_at": "2026-01-01T10:00:00Z"
  }
}
```

Validasi:
- destination_id: required, destination must exist
- rating: required, 1-5
- review_text: optional

Logic:
1. Validate destination exists
2. Create user review
3. Update destination `user_rating` (recalculate average)
4. Update destination `user_review_count`
5. Return created review

---

## Steps

### 1. Buat Reviews Module (untuk user reviews)

```bash
nest g module modules/reviews
nest g controller modules/reviews
nest g service modules/reviews
```

### 2. Buat DTOs

- `create-user-review.dto.ts`

### 3. Implementasi Reviews Service

- `createUserReview()` — create review, recalculate destination ratings
- `recalculateUserRating()` — AVG rating dari semua user reviews per destination

### 4. Implementasi Controller

- `@Post()` — requires JWT

---

## Files yang Dibuat

```text
src/modules/reviews/
├── reviews.module.ts             (new)
├── user-reviews.controller.ts    (new)
├── reviews.service.ts            (new)
├── dto/
│   └── create-user-review.dto.ts (new)
```

---

## Acceptance Criteria

- [ ] POST berhasil membuat user review
- [ ] Rating divalidasi (1-5)
- [ ] Destination user_rating terupdate setelah review baru
- [ ] Destination user_review_count terupdate
- [ ] Return 404 jika destination tidak ada
- [ ] Requires JWT (401 tanpa token)
