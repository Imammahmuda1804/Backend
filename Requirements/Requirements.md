# REQUIREMENTS.md — Backend Service (NestJS)

# 1. Overview

Backend ini merupakan pusat orkestrasi utama sistem rekomendasi wisata berbasis AI.

Backend bertanggung jawab untuk:

* autentikasi user dan admin
* manajemen data destinasi wisata
* scraping ulasan Google Maps
* integrasi NLP Service (FastAPI)
* semantic search
* recommendation engine
* analytics dashboard
* penyimpanan hasil NLP
* API untuk frontend web/mobile

Backend harus sepenuhnya sinkron dengan:

* UML diagram proyek
* struktur NLP service
* frontend flow
* ERD
* semantic search architecture

Seluruh endpoint wajib siap digunakan langsung oleh frontend tanpa transformasi tambahan.

---

# 2. Core Architecture

## 2.1 Technology Stack

| Component         | Technology       |
| ----------------- | ---------------- |
| Framework         | NestJS 11        |
| Runtime           | Node.js 20 LTS   |
| Language          | TypeScript 5     |
| ORM               | Prisma ORM       |
| Database          | PostgreSQL 16    |
| Vector Search     | pgvector         |
| Authentication    | JWT + Passport   |
| Validation        | class-validator  |
| File Upload       | Multer           |
| API Documentation | Swagger          |
| Cache & Queue     | Redis (REQUIRED) |
| Queue             | BullMQ           |
| HTTP Client       | @nestjs/axios    |
| Config Management | @nestjs/config   |
| Scraping API      | Apify API        |

---

# 3. High-Level System Architecture

```text id="mdo00n"
Frontend
↓
NestJS Backend
├── Auth
├── Scraper Service
├── Recommendation Service
├── Analytics Service
├── Search Service
├── Admin Service
└── NLP Integration Service
        ↓
    FastAPI NLP Service
        ↓
PostgreSQL + pgvector
```

---

# 4. Backend Responsibilities

Backend:

* melakukan scraping Google Maps
* menyimpan raw review
* mengirim CSV internal ke FastAPI
* menerima hasil NLP
* menyimpan hasil analytics
* melakukan semantic search
* menyediakan recommendation API
* menyediakan analytics dashboard
* menyediakan comparison analytics

Backend tidak melakukan:

* sentiment inference
* embedding generation
* topic modeling

Semua NLP diproses di FastAPI.

---

# 5. Folder Structure

```text id="7n99if"
src/
├── main.ts
├── app.module.ts
│
├── config/
│   ├── env.config.ts
│   └── swagger.config.ts
│
├── common/
│   ├── guards/
│   ├── interceptors/
│   ├── decorators/
│   ├── filters/
│   ├── dto/
│   ├── constants/
│   ├── interfaces/
│   └── utils/
│
├── prisma/
│   ├── prisma.module.ts
│   ├── prisma.service.ts
│   └── schema.prisma
│
├── modules/
│
│   ├── auth/
│   ├── users/
│   ├── destinations/
│   ├── reviews/
│   ├── analytics/
│   ├── recommendation/
│   ├── search/
│   ├── topics/
│   ├── favorites/
│   ├── uploads/
│   ├── admin/
│   ├── scraper/
│   └── nlp/
```

---

# 6. Authentication & Authorization

## Roles

| Role  | Description |
| ----- | ----------- |
| ADMIN | Full access |
| USER  | Public user |

---

## Authentication

Menggunakan:

* JWT Access Token
* JWT Refresh Token
* Passport JWT Strategy

---

## Security Requirement

Wajib menggunakan:

* bcrypt password hashing
* helmet
* cors
* rate limiting
* global validation pipe
* JWT expiration
* role-based guard

---

# 7. Database Specification

## PostgreSQL Extension

```sql id="t3cplh"
CREATE EXTENSION vector;
```

> **Catatan Prisma + pgvector:**
> Prisma ORM tidak mendukung tipe `vector` secara native.
> Field embedding harus menggunakan `Unsupported("vector")` di schema Prisma.
> Semua operasi vector (insert, similarity search) wajib menggunakan `prisma.$queryRaw`.
> Buat dedicated `VectorService` untuk menangani semua operasi pgvector.

---

# 8. Main Database Tables

## users

```text id="lp1m9f"
id
name
email
password
role
status
created_at
updated_at
```

---

## destinations

```text id="69xhmv"
id

name
slug
description

city
province

latitude
longitude

google_maps_url
google_place_id

google_rating
google_review_count

user_rating
user_review_count

youtube_url
thumbnail_url

embedding VECTOR(384)

positive_ratio
recommendation_score

created_at
updated_at
deleted_at
```

---

## destination_images

```text id="nv1yp6"
id
destination_id
image_url
created_at
```

---

## reviews

```text id="v4vg9p"
id

destination_id

reviewer_name

review_text
cleaned_text

rating

review_date

source

likes_count
owner_reply

sentiment

topic_id

created_at
```

---

## review_embeddings

```text id="8h3s5k"
id
review_id
embedding VECTOR(384)
```

---

## topics

```text id="w9om2d"
id
topic_name
keywords JSONB
created_at
```

---

## destination_topics

```text id="ql4j31"
id
destination_id
topic_id
total_reviews
```

---

## sentiment_trends

```text id="0vhh1o"
id
destination_id
date
positive_count
negative_count
neutral_count
```

---

## favorites

```text id="4r4qeo"
id
user_id
destination_id
created_at
```

---

## search_logs

```text id="s66ue3"
id
user_id
keyword
created_at
```

---

## user_reviews

```text id="1g7wq3"
id
user_id
destination_id
rating
review_text
created_at
```

---

## scraping_jobs

```text id="c9xzbz"
id
destination_id
status
source
total_reviews
started_at
finished_at
error_message
created_by
```

---

## scraping_history

```text id="lfp5gv"
id
destination_id
job_id
total_reviews
stars_filter
has_text
sort
created_at
```

---

# 9. NLP Integration Architecture

```text id="xx8b9p"
Admin
↓
NestJS Backend
↓
Scraping Google Maps
↓
Save Raw Reviews
↓
Generate Internal CSV
↓
POST FastAPI /pipeline/process
↓
Receive NLP Result
↓
Save Analytics
↓
Frontend Dashboard
```

---

# 10. FastAPI NLP Integration

## Base URL

```env id="3yw6f3"
NLP_SERVICE_URL=http://localhost:8001
```

---

## NLP Endpoints Used

| Endpoint               | Purpose                       |
| ---------------------- | ----------------------------- |
| POST /pipeline/process | Sentiment + topic + embedding |
| POST /embed            | Semantic search embedding     |

---

# 11. Semantic Search Architecture

```text id="y3fhtr"
User Query
↓
NestJS Backend
↓
POST /embed
↓
Receive query embedding
↓
PostgreSQL similarity search
↓
Return ranked destination
```

---

## Similarity Query

```sql id="0j0v9q"
SELECT *
FROM destinations
ORDER BY embedding <-> query_vector
LIMIT 10;
```

---

# 12. Recommendation Score Formula

Recommendation ranking menggunakan kombinasi:

```text id="3fap3u"
recommendation_score =
(semantic_score * 0.4)
+
(positive_ratio * 0.4)
+
(user_rating * 0.2)
```

---

# 13. Hybrid Recommendation Strategy

Final ranking mempertimbangkan:

1. semantic similarity
2. positive sentiment ratio
3. user rating

```sql id="n6k6uc"
ORDER BY
embedding <-> query_vector,
positive_ratio DESC,
user_rating DESC
```

---

# 14. Scraping Architecture

Scraping dilakukan sepenuhnya oleh backend NestJS.

FastAPI tidak melakukan scraping.

---

# 15. Scraper Responsibilities

ScraperService bertanggung jawab untuk:

* search Google Maps place
* scraping reviews
* polling scraping progress
* save raw reviews
* generate temporary CSV
* trigger NLP pipeline

---

# 16. Scraping Features

| Feature            | Required |
| ------------------ | -------- |
| Search Google Maps | YES      |
| Direct URL input   | YES      |
| Smart sort         | YES      |
| Over-fetch         | YES      |
| Star filter        | YES      |
| Text-only filter   | YES      |
| Polling progress   | YES      |
| Async scraping     | YES      |
| Scraping history   | YES      |
| CSV download       | YES      |

---

# 17. Pagination Response Standard

Semua endpoint list wajib menggunakan format:

```json id="jpxyfh"
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "total_pages": 10
  }
}
```

---

# 18. Sorting & Filtering Standard

Endpoint list wajib mendukung:

* pagination
* search
* sorting
* filtering

Contoh:

```http id="mjlwm6"
GET /admin/destinations?page=1&limit=10&sort=positive_ratio&order=desc
```

---

# 19. Authentication Endpoints

## POST /auth/register

```json id="lzn2df"
{
  "name": "John",
  "email": "john@mail.com",
  "password": "123456"
}
```

---

## POST /auth/login

```json id="j1a0vo"
{
  "access_token": "...",
  "refresh_token": "...",
  "user": {
    "id": 1,
    "role": "USER"
  }
}
```

---

## POST /auth/refresh

Mendapatkan access token baru menggunakan refresh token.

Request:

```json
{
  "refresh_token": "..."
}
```

Response:

```json
{
  "access_token": "...",
  "refresh_token": "..."
}
```

---

## POST /auth/logout

Invalidate refresh token user.

Request:

```json
{
  "refresh_token": "..."
}
```

Response:

```json
{
  "message": "Logged out successfully"
}
```

---

# 20. Destination Endpoints

## GET /destinations/recommendations

Landing page recommendation.

### Query

```text id="t8tix2"
?page=1&limit=10
```

---

## GET /destinations/:id

Destination detail.

Response wajib mencakup:

* metadata
* gallery images
* youtube trailer
* sentiment summary
* sentiment trend
* topic insights
* ratings
* recommendation score

---

## GET /destinations/:id/analytics

Analytics khusus destination.

Response:

* sentiment distribution
* topic distribution
* trend chart data
* rating analytics

---

## GET /destinations/ranking

Top destinations berdasarkan:

* sentiment
* recommendation score
* user rating

---

# 21. Search Endpoints

## POST /search

Semantic search utama.

```json id="4e21ev"
{
  "query": "wisata keluarga murah"
}
```

---

## GET /search/history

Riwayat pencarian user.

---

## DELETE /search/history

Hapus semua riwayat pencarian user.

---

## DELETE /search/history/:id

Hapus satu entry riwayat pencarian.

---

# 22. Favorite Endpoints

## POST /favorites/:destinationId

Save destination.

---

## GET /favorites

Get saved destinations.

---

## DELETE /favorites/:destinationId

Hapus destinasi dari favorites/wishlist.

---

# 22.5 User Profile Endpoints

## GET /users/me

Get current user profile.

Response:

```json
{
  "id": 1,
  "name": "John",
  "email": "john@mail.com",
  "role": "USER",
  "created_at": "..."
}
```

---

## PUT /users/me

Update user profile.

Editable:

* name
* email
* password

---

# 23. User Review Endpoints

## POST /user-reviews

User rating & review.

---

# 24. Scraper Endpoints

## GET /admin/scraper/search

Cari tempat wisata Google Maps.

```text id="wkv3wm"
?q=jam gadang
```

---

## POST /admin/scraper/start

Trigger scraping.

```json id="amojl6"
{
  "destination_id": 1,
  "max_reviews": 1000,
  "sort": "newest",
  "stars_filter": [5,4],
  "has_text": true
}
```

---

## GET /admin/scraper/status/:jobId

Polling scraping progress.

---

## GET /admin/scraper/jobs

List semua scraping jobs.

---

## GET /admin/scraper/history

Riwayat scraping.

---

## GET /admin/scraper/download/:jobId

Download hasil scraping CSV.

---

## POST /admin/scraper/process/:jobId

Flow:

1. generate internal CSV
2. kirim ke FastAPI
3. save analytics

---

# 25. Analytics Endpoints

## GET /analytics/dashboard

Return:

* total destinations
* total reviews
* sentiment distribution
* top topics
* top recommendation

---

## GET /admin/dashboard/summary

Return:

* total users
* total destinations
* total reviews
* total scraping jobs
* sentiment distribution
* top destinations
* latest scraping jobs

---

## GET /admin/dashboard/activity

Return:

* recent scraping
* recent analytics
* recent reviews
* recent users

---

## GET /admin/dashboard/trends

Return:

* daily trends
* weekly trends
* monthly trends

---

## GET /analytics/destination/:id

Analytics satu destination.

---

## GET /analytics/destination/:id/topics

Topic distribution satu destination.

Response:

```json id="uwv3wu"
{
  "topics": [
    {
      "topic": "akses jalan",
      "percentage": 34
    }
  ]
}
```

---

## GET /analytics/compare

Perbandingan dua destination.

```text id="ov8zpd"
?destination1=1&destination2=2
```

Response wajib mencakup:

* sentiment comparison
* topic comparison
* rating comparison
* trend comparison

---

## GET /analytics/trends/:id

Trend sentimen:

* harian
* mingguan
* bulanan

---

## GET /admin/analytics/export/:destinationId

Export analytics CSV.

---

# 26. Topic Endpoints

## GET /topics

List semua topic.

---

## GET /topics/:id/destinations

Filter destination berdasarkan topic.

---

# 27. File Upload & Upload Endpoint

## POST /admin/destinations/:id/upload-reviews

Upload file review untuk destinasi tertentu.

Request: multipart/form-data

Allowed format:

* csv
* xlsx
* xls

Max size:

* 10MB

Max rows:

* 50.000

Flow:

1. upload file
2. validate format & size
3. parse file ke internal CSV
4. kirim ke FastAPI /pipeline/process
5. save analytics result

---

# 28. Environment Variables

```env id="wq4tlr"
PORT=3000

DATABASE_URL=postgresql://...

JWT_SECRET=...

JWT_REFRESH_SECRET=...

NLP_SERVICE_URL=http://localhost:8001

APIFY_TOKEN=...

REDIS_HOST=localhost
REDIS_PORT=6379
```

---

# 29. Required Libraries

```text id="j7w8pv"
@nestjs/common
@nestjs/core
@nestjs/jwt
@nestjs/passport
@nestjs/swagger
@nestjs/platform-express
@nestjs/config
@nestjs/axios
@nestjs/bullmq
@nestjs/throttler

passport
passport-jwt

bcrypt
helmet

class-validator
class-transformer

multer

prisma
@prisma/client

bullmq
ioredis

csv-parser
xlsx
```

---

# 30. Swagger Requirement

Swagger wajib aktif:

```text id="ryo7os"
/api/docs
```

Semua DTO wajib memiliki swagger decorator.

---

# 31. Error Handling Standard

```json id="82cbx6"
{
  "statusCode": 400,
  "message": "Invalid request",
  "error": "Bad Request"
}
```

---

# 32. Performance Constraints

| Type             | Limit      |
| ---------------- | ---------- |
| Search Result    | 50         |
| Upload Size      | 10MB       |
| Max Reviews      | 50.000     |
| Scraping Timeout | 15 minutes |

---

# 33. Queue & Async Processing

BullMQ wajib digunakan untuk:

* scraping jobs
* NLP processing jobs
* analytics generation

---

# 34. Architectural Constraints

Backend:

* tidak melakukan NLP processing
* tidak melakukan embedding generation
* tidak melakukan topic modeling

Semua NLP dilakukan oleh FastAPI.

---

# 35. Admin Management Endpoints

Semua endpoint admin:

* wajib menggunakan JWT admin guard
* hanya dapat diakses role ADMIN

---

## 35.1 Destination Management

### POST /admin/destinations

Membuat destination baru.

```json id="jlwm56"
{
  "name": "Jam Gadang",
  "description": "Ikon wisata Bukittinggi",
  "city": "Bukittinggi",
  "province": "Sumatera Barat",
  "latitude": -0.305,
  "longitude": 100.369,
  "google_maps_url": "https://maps.google.com/...",
  "youtube_url": "https://youtube.com/...",
  "thumbnail_url": "https://..."
}
```

---

### PUT /admin/destinations/:id

Mengedit destination.

Editable:

* name
* description
* city
* province
* coordinates
* google_maps_url
* youtube_url
* thumbnail_url

---

### DELETE /admin/destinations/:id

Soft delete destination.

---

### GET /admin/destinations

List semua destination dashboard admin.

```text id="63mow5"
?page=1&limit=10&search=jam
```

---

### GET /admin/destinations/:id

Detail destination admin.

Response:

* metadata
* images
* analytics summary
* scraping history
* sentiment summary
* topic summary

---

## 35.2 Destination Image Management

### POST /admin/destinations/:id/images

Upload gallery image.

---

### DELETE /admin/destination-images/:id

Delete image.

---

## 35.3 User Management

### GET /admin/users

List semua user.

```text id="3gxnlw"
?page=1&limit=10&search=john
```

---

### GET /admin/users/:id

Detail user.

Response:

* profile
* favorites
* reviews
* search history

---

### PUT /admin/users/:id

Edit:

* name
* email
* role
* status

---

### DELETE /admin/users/:id

Soft delete / suspend user.

---

## 35.4 Scraping Destination Management

### PUT /admin/destinations/:id/maps-url

Update Google Maps URL.

---

### POST /admin/destinations/:id/scrape

Shortcut scraping berdasarkan destination.

Flow:

1. ambil google_maps_url
2. trigger scraper
3. create scraping job

---

## 35.5 Analytics Management

### POST /admin/analytics/recalculate/:destinationId

Recalculate:

* sentiment summary
* topic distribution
* trends
* recommendation score

---

## 35.6 Moderation

### DELETE /admin/reviews/:id

Delete inappropriate review.

---

### DELETE /admin/user-reviews/:id

Delete user review.

---

## 35.7 Dashboard Summary

### GET /admin/dashboard/summary

Return:

* total users
* total destinations
* total reviews
* total scraping jobs
* sentiment distribution
* top destinations
* latest scraping jobs

---

## 35.8 Dashboard Activity

### GET /admin/dashboard/activity

Return:

* recent scraping
* recent analytics
* recent reviews
* recent users

---

# 36. Expected System Capability

Backend wajib mendukung:

* semantic search
* AI recommendation
* Google Maps scraping
* sentiment analytics
* topic analytics
* destination comparison
* recommendation landing page
* hybrid ranking
* saved destination
* user review & rating
* analytics dashboard
* trend analytics
* async processing
* NLP orchestration
