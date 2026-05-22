# Dokumentasi API Backend RANAHINSIGHT

Base URL development:

```txt
http://localhost:3000/api
```

Swagger:

```txt
http://localhost:3000/api/docs
```

Format auth:

```http
Authorization: Bearer <access_token>
```

Role:

- `Public`: tidak perlu token.
- `User`: perlu token user/admin.
- `Admin`: perlu token dengan role `ADMIN`.

## Status Swagger

Audit controller menunjukkan semua controller aktif sudah memiliki `@ApiTags` dan masuk module yang diimport ke `AppModule`. Artinya endpoint controller aktif akan masuk ke `/api/docs` melalui `SwaggerModule.createDocument(app, swaggerConfig)`.

Jika ada endpoint baru, tambahkan minimal:

- `@ApiTags` di controller;
- `@ApiOperation` di method;
- `@ApiResponse` untuk response penting;
- `@ApiBody` jika menerima body;
- controller didaftarkan dalam module.

## Health

### GET `/`

Role: Public.

Kegunaan: cek backend hidup.

File:

- `src/app.controller.ts`
- `src/app.service.ts`

Cara pakai:

```powershell
curl http://localhost:3000/api
```

### GET `/test-nlp`

Role: Public.

Kegunaan: cek koneksi backend ke NLP service.

File:

- `src/app.controller.ts`
- `src/app.service.ts`
- `src/modules/nlp/nlp.service.ts`

## Authentication

### POST `/auth/register`

Role: Public.

Kegunaan: membuat akun user baru.

File:

- `src/modules/auth/auth.controller.ts`
- `src/modules/auth/auth.service.ts`
- `src/modules/auth/dto/register.dto.ts`

Body:

```json
{
  "name": "User Baru",
  "email": "user@mail.com",
  "password": "password123"
}
```

### POST `/auth/login`

Role: Public.

Kegunaan: login user/admin dan mendapatkan access token.

File:

- `src/modules/auth/auth.controller.ts`
- `src/modules/auth/auth.service.ts`
- `src/modules/auth/dto/login.dto.ts`

Body:

```json
{
  "email": "admin@mail.com",
  "password": "password"
}
```

### POST `/auth/refresh`

Role: Public.

Kegunaan: memperbarui access token memakai refresh token.

File:

- `src/modules/auth/auth.controller.ts`
- `src/modules/auth/auth.service.ts`
- `src/modules/auth/dto/refresh-token.dto.ts`

Body:

```json
{
  "refresh_token": "token"
}
```

### POST `/auth/logout`

Role: User.

Kegunaan: logout dengan refresh token.

File:

- `src/modules/auth/auth.controller.ts`
- `src/modules/auth/auth.service.ts`
- `src/modules/auth/dto/refresh-token.dto.ts`

Body:

```json
{
  "refresh_token": "token"
}
```

## Users

### GET `/users/me`

Role: User.

Kegunaan: mengambil profile user login.

File:

- `src/modules/users/users.controller.ts`
- `src/modules/users/users.service.ts`

### PUT `/users/me`

Role: User.

Kegunaan: update nama, email, dan data profile user.

File:

- `src/modules/users/users.controller.ts`
- `src/modules/users/users.service.ts`
- `src/modules/users/dto/update-profile.dto.ts`

Body contoh:

```json
{
  "name": "Muhammad",
  "email": "user@mail.com"
}
```

### POST `/users/me/avatar`

Role: User.

Kegunaan: upload foto profile.

File:

- `src/modules/users/users.controller.ts`
- `src/modules/users/users.service.ts`
- `src/config/multer.config.ts`

Form data:

- `file`: gambar profile.

## Public Destinations

### GET `/destinations/cities`

Role: Public.

Kegunaan: mengambil daftar kota unik untuk filter search.

File:

- `src/modules/destinations/destinations.controller.ts`
- `src/modules/destinations/destinations.service.ts`

### GET `/destinations/categories`

Role: Public.

Kegunaan: mengambil kategori fixed destinasi.

File:

- `src/modules/destinations/destinations.controller.ts`
- `src/modules/destinations/destination-categories.ts`
- `src/modules/destinations/destinations.service.ts`

### GET `/destinations`

Role: Public.

Kegunaan: list destinasi dengan pagination dan filter.

File:

- `src/modules/destinations/destinations.controller.ts`
- `src/modules/destinations/destinations.service.ts`
- `src/modules/destinations/dto/destination-query.dto.ts`

Query umum:

| Query | Keterangan |
| --- | --- |
| `page` | Nomor halaman. |
| `limit` | Jumlah data. |
| `search` | Keyword nama/deskripsi. |
| `city` | Filter kota. |
| `category` | Filter kategori. |
| `topic_id` | Filter satu topic. |
| `topic_ids` | Filter banyak topic, dipisah koma. |

### GET `/destinations/recommendations`

Role: Public.

Kegunaan: mengambil destinasi rekomendasi.

File:

- `src/modules/destinations/destinations.controller.ts`
- `src/modules/destinations/destinations.service.ts`

### GET `/destinations/ranking`

Role: Public.

Kegunaan: mengambil ranking destinasi.

File:

- `src/modules/destinations/destinations.controller.ts`
- `src/modules/destinations/destinations.service.ts`

Query:

- `sort_by`: field ranking.
- `limit`: jumlah data.

### GET `/destinations/slug/:slug`

Role: Public.

Kegunaan: detail destinasi berdasarkan slug untuk halaman detail web.

File:

- `src/modules/destinations/destinations.controller.ts`
- `src/modules/destinations/destinations.service.ts`

### GET `/destinations/:id`

Role: Public.

Kegunaan: detail destinasi berdasarkan ID untuk mobile/legacy.

File:

- `src/modules/destinations/destinations.controller.ts`
- `src/modules/destinations/destinations.service.ts`

### GET `/destinations/:id/reviews-by-topic`

Role: Public.

Kegunaan: mengambil scraped review destinasi berdasarkan fine topic.

File:

- `src/modules/destinations/destinations.controller.ts`
- `src/modules/destinations/destinations.service.ts`

Query:

- `topicId`: ID topic.
- `page`: halaman.
- `limit`: jumlah data.

### GET `/destinations/:id/reviews-by-topic-group`

Role: Public.

Kegunaan: mengambil scraped review berdasarkan broad topic group.

File:

- `src/modules/destinations/destinations.controller.ts`
- `src/modules/destinations/destinations.service.ts`

Query:

- `groupId`: ID topic group.
- `page`: halaman.
- `limit`: jumlah data.

## Search

### POST `/search`

Role: Public, token opsional.

Kegunaan: keyword atau semantic search. Jika token valid, search history disimpan.

File:

- `src/modules/search/search.controller.ts`
- `src/modules/search/search.service.ts`
- `src/modules/search/dto/search-query.dto.ts`
- `src/modules/nlp/nlp.service.ts`
- `src/modules/vector/vector.service.ts`

Body contoh:

```json
{
  "query": "pantai untuk keluarga",
  "mode": "semantic",
  "city": "Padang",
  "category": "pantai",
  "min_rating": 4
}
```

### GET `/search/history`

Role: User.

Kegunaan: mengambil riwayat pencarian user.

File:

- `src/modules/search/search.controller.ts`
- `src/modules/search/search.service.ts`

### DELETE `/search/history`

Role: User.

Kegunaan: hapus semua search history user.

File:

- `src/modules/search/search.controller.ts`
- `src/modules/search/search.service.ts`

### DELETE `/search/history/:id`

Role: User.

Kegunaan: hapus satu item search history.

File:

- `src/modules/search/search.controller.ts`
- `src/modules/search/search.service.ts`

## Favorites

### POST `/favorites/:destinationId`

Role: User.

Kegunaan: menambah destinasi ke favorit.

File:

- `src/modules/favorites/favorites.controller.ts`
- `src/modules/favorites/favorites.service.ts`

### GET `/favorites`

Role: User.

Kegunaan: mengambil daftar favorit user.

File:

- `src/modules/favorites/favorites.controller.ts`
- `src/modules/favorites/favorites.service.ts`

### GET `/favorites/check/:destinationId`

Role: User.

Kegunaan: cek apakah destinasi sudah difavoritkan.

File:

- `src/modules/favorites/favorites.controller.ts`
- `src/modules/favorites/favorites.service.ts`

## User Reviews

### POST `/user-reviews`

Role: User.

Kegunaan: user aplikasi memberi ulasan dan rating destinasi.

File:

- `src/modules/reviews/user-reviews.controller.ts`
- `src/modules/reviews/reviews.service.ts`
- `src/modules/reviews/dto/create-user-review.dto.ts`

Body contoh:

```json
{
  "destination_id": 1,
  "rating": 5,
  "review_text": "Tempatnya bersih dan cocok untuk keluarga"
}
```

## Public Analytics

### GET `/analytics/dashboard`

Role: Public.

Kegunaan: ringkasan analytics publik.

File:

- `src/modules/analytics/analytics.controller.ts`
- `src/modules/analytics/analytics.service.ts`

### GET `/analytics/destination/:id`

Role: Public.

Kegunaan: analytics satu destinasi.

File:

- `src/modules/analytics/analytics.controller.ts`
- `src/modules/analytics/analytics.service.ts`

### GET `/analytics/destination/:id/topics`

Role: Public.

Kegunaan: analytics topic destinasi.

File:

- `src/modules/analytics/analytics.controller.ts`
- `src/modules/analytics/analytics.service.ts`

### GET `/analytics/trends/:id`

Role: Public.

Kegunaan: trend sentimen destinasi.

File:

- `src/modules/analytics/analytics.controller.ts`
- `src/modules/analytics/analytics.service.ts`

Query:

- `period`: periode trend.

### GET `/analytics/compare`

Role: Public.

Kegunaan: compare analytics dua destinasi.

File:

- `src/modules/analytics/analytics.controller.ts`
- `src/modules/analytics/analytics.service.ts`
- `src/modules/analytics/dto/compare-query.dto.ts`

Query:

- `destinationAId`
- `destinationBId`

## Topics

### GET `/topics`

Role: Public.

Kegunaan: mengambil list topic. Dapat dipakai search/detail/admin.

File:

- `src/modules/topics/topics.controller.ts`
- `src/modules/topics/topics.service.ts`

Query:

- `scope=search`
- `scope=detail`

### GET `/topics/groups`

Role: Public.

Kegunaan: mengambil topic group luas.

File:

- `src/modules/topics/topics.controller.ts`
- `src/modules/topics/topics.service.ts`

### GET `/topics/:id/destinations`

Role: Public.

Kegunaan: mengambil destinasi yang berkaitan dengan topic.

File:

- `src/modules/topics/topics.controller.ts`
- `src/modules/topics/topics.service.ts`

### POST `/topics/rename-ai`

Role: Admin.

Kegunaan: menamai ulang topic fallback seperti `Topic 17` memakai AI naming.

File:

- `src/modules/topics/topics.controller.ts`
- `src/modules/topics/topics.service.ts`
- `src/modules/nlp/ai-naming.service.ts`

### PUT `/topics/groups/:id/rename`

Role: Admin.

Kegunaan: mengganti nama topic group luas.

File:

- `src/modules/topics/topics.controller.ts`
- `src/modules/topics/topics.service.ts`
- `src/modules/topics/dto/topic-admin.dto.ts`

Body:

```json
{
  "groupName": "Harga & Pengalaman"
}
```

### PUT `/topics/:id/rename`

Role: Admin.

Kegunaan: mengganti nama topic sempit secara manual.

File:

- `src/modules/topics/topics.controller.ts`
- `src/modules/topics/topics.service.ts`
- `src/modules/topics/dto/topic-admin.dto.ts`

Body:

```json
{
  "topicName": "Tiket mahal"
}
```

### PUT `/topics/:id/settings`

Role: Admin.

Kegunaan: mengubah group dan visibility topic untuk search/detail.

File:

- `src/modules/topics/topics.controller.ts`
- `src/modules/topics/topics.service.ts`
- `src/modules/topics/dto/topic-admin.dto.ts`

Body:

```json
{
  "groupId": 1,
  "isSearchVisible": true,
  "isDetailVisible": true
}
```

### DELETE `/topics/:id`

Role: Admin.

Kegunaan: hapus topic.

File:

- `src/modules/topics/topics.controller.ts`
- `src/modules/topics/topics.service.ts`

## Admin Destinations

Semua endpoint di bagian ini Role: Admin.

### POST `/admin/destinations`

Kegunaan: membuat destinasi.

File:

- `src/modules/destinations/admin-destinations.controller.ts`
- `src/modules/destinations/destinations.service.ts`
- `src/modules/destinations/dto/create-destination.dto.ts`

### GET `/admin/destinations`

Kegunaan: list destinasi admin.

File:

- `src/modules/destinations/admin-destinations.controller.ts`
- `src/modules/destinations/destinations.service.ts`

### GET `/admin/destinations/:id`

Kegunaan: detail destinasi admin.

File:

- `src/modules/destinations/admin-destinations.controller.ts`
- `src/modules/destinations/destinations.service.ts`

### PUT `/admin/destinations/:id`

Kegunaan: update destinasi.

File:

- `src/modules/destinations/admin-destinations.controller.ts`
- `src/modules/destinations/destinations.service.ts`
- `src/modules/destinations/dto/update-destination.dto.ts`

### DELETE `/admin/destinations/:id`

Kegunaan: hapus destinasi.

File:

- `src/modules/destinations/admin-destinations.controller.ts`
- `src/modules/destinations/destinations.service.ts`

### PUT `/admin/destinations/:id/maps-url`

Kegunaan: update URL Google Maps.

File:

- `src/modules/destinations/admin-destinations.controller.ts`
- `src/modules/destinations/dto/update-maps-url.dto.ts`
- `src/modules/destinations/destinations.service.ts`

### POST `/admin/destinations/:id/thumbnail`

Kegunaan: upload thumbnail destinasi.

File:

- `src/modules/destinations/admin-destinations.controller.ts`
- `src/config/multer.config.ts`
- `src/modules/destinations/destinations.service.ts`

Form data:

- `file`: gambar thumbnail.

### POST `/admin/destinations/:id/images`

Kegunaan: upload foto galeri destinasi.

File:

- `src/modules/destinations/admin-destinations.controller.ts`
- `src/config/multer.config.ts`
- `src/modules/destinations/destinations.service.ts`

Form data:

- `files`: satu atau banyak gambar.

### DELETE `/admin/destinations/images/:imageId`

Kegunaan: hapus gambar galeri.

File:

- `src/modules/destinations/admin-destinations.controller.ts`
- `src/modules/destinations/destinations.service.ts`

### POST `/admin/destinations/:id/scrape`

Kegunaan: memulai scraping review untuk destinasi tertentu.

File:

- `src/modules/destinations/admin-destinations.controller.ts`
- `src/modules/scraper/scraper.service.ts`
- `src/modules/scraper/dto/start-scraping.dto.ts`

## Admin Reviews dan Moderation

### GET `/admin/reviews/destination/:id`

Role: Admin.

Kegunaan: list review destinasi untuk admin.

File:

- `src/modules/reviews/admin-reviews.controller.ts`
- `src/modules/reviews/reviews.service.ts`

### DELETE `/admin/reviews/destination/:id/bulk`

Role: Admin.

Kegunaan: bulk delete review destinasi.

File:

- `src/modules/reviews/admin-reviews.controller.ts`
- `src/modules/reviews/reviews.service.ts`
- `src/modules/reviews/dto/bulk-delete-reviews.dto.ts`

### DELETE `/admin/reviews/:id`

Role: Admin.

Kegunaan: hapus satu scraped review.

File:

- `src/modules/reviews/admin-reviews.controller.ts`
- `src/modules/reviews/reviews.service.ts`

### DELETE `/admin/moderation/reviews/:id`

Role: Admin.

Kegunaan: endpoint moderation untuk hapus scraped review. Route ini sengaja memakai namespace `moderation` agar tidak overlap dengan `DELETE /admin/reviews/:id` milik `AdminReviewsController`.

File:

- `src/modules/admin/admin-moderation.controller.ts`
- `src/modules/reviews/reviews.service.ts`

### DELETE `/admin/user-reviews/:id`

Role: Admin.

Kegunaan: hapus review user aplikasi.

File:

- `src/modules/admin/admin-moderation.controller.ts`
- `src/modules/reviews/reviews.service.ts`

### POST `/admin/analytics/recalculate/:destinationId`

Role: Admin.

Kegunaan: hitung ulang analytics destinasi.

File:

- `src/modules/admin/admin-moderation.controller.ts`
- `src/modules/analytics/analytics.service.ts`

## Admin Users

Semua endpoint Role: Admin.

### GET `/admin/users`

Kegunaan: list user admin.

File:

- `src/modules/admin/admin-users.controller.ts`
- `src/modules/users/users.service.ts`

### GET `/admin/users/:id`

Kegunaan: detail user.

File:

- `src/modules/admin/admin-users.controller.ts`
- `src/modules/users/users.service.ts`

### POST `/admin/users`

Kegunaan: membuat user.

File:

- `src/modules/admin/admin-users.controller.ts`
- `src/modules/users/users.service.ts`
- `src/modules/users/dto/admin-create-user.dto.ts`

### PUT `/admin/users/:id`

Kegunaan: update user.

File:

- `src/modules/admin/admin-users.controller.ts`
- `src/modules/users/users.service.ts`
- `src/modules/users/dto/admin-update-user.dto.ts`

### DELETE `/admin/users/:id`

Kegunaan: hapus user.

File:

- `src/modules/admin/admin-users.controller.ts`
- `src/modules/users/users.service.ts`

## Admin Analytics

Semua endpoint Role: Admin.

### GET `/admin/dashboard/summary`

Kegunaan: ringkasan dashboard admin.

File:

- `src/modules/analytics/admin-analytics.controller.ts`
- `src/modules/analytics/analytics.service.ts`

### GET `/admin/dashboard/activity`

Kegunaan: aktivitas terbaru dashboard admin.

File:

- `src/modules/analytics/admin-analytics.controller.ts`
- `src/modules/analytics/analytics.service.ts`

### GET `/admin/dashboard/trends`

Kegunaan: trend dashboard admin.

File:

- `src/modules/analytics/admin-analytics.controller.ts`
- `src/modules/analytics/analytics.service.ts`

### GET `/admin/analytics/export/:destinationId`

Kegunaan: export analytics destinasi.

File:

- `src/modules/analytics/admin-analytics.controller.ts`
- `src/modules/analytics/analytics.service.ts`

## Admin Scraper

### GET `/admin/scraper/search`

Role: Admin.

Kegunaan: mencari tempat dari Google Maps sebelum scraping.

File:

- `src/modules/scraper/scraper.controller.ts`
- `src/modules/scraper/scraper.service.ts`
- `src/modules/scraper/dto/search-query.dto.ts`

Query:

- `q`: kata kunci pencarian tempat.

### POST `/admin/scraper/start`

Role: Admin.

Kegunaan: memulai job scraping review destinasi.

File:

- `src/modules/scraper/scraper.controller.ts`
- `src/modules/scraper/scraper.service.ts`
- `src/modules/scraper/dto/start-scraping.dto.ts`

Body:

```json
{
  "destination_id": 1,
  "max_reviews": 100,
  "maps_url": "https://maps.google.com/..."
}
```

### GET `/admin/scraper/status/:jobId`

Role: Admin.

Kegunaan: mengecek status job scraping.

File:

- `src/modules/scraper/scraper.controller.ts`
- `src/modules/scraper/scraper.service.ts`

### GET `/admin/scraper/jobs`

Role: Admin.

Kegunaan: mengambil daftar job scraping.

File:

- `src/modules/scraper/scraper.controller.ts`
- `src/modules/scraper/scraper.service.ts`
- `src/modules/scraper/dto/job-query.dto.ts`

Query:

- `page`
- `limit`
- `status`

### GET `/admin/scraper/history`

Role: Admin.

Kegunaan: mengambil riwayat review hasil scraping.

File:

- `src/modules/scraper/scraper.controller.ts`
- `src/modules/scraper/scraper.service.ts`
- `src/modules/scraper/dto/history-query.dto.ts`

Query:

- `page`
- `limit`
- `destination_id`

### GET `/admin/scraper/download/:jobId`

Role: Admin.

Kegunaan: download hasil scraping dalam Excel.

File:

- `src/modules/scraper/scraper.controller.ts`
- `src/modules/scraper/scraper.service.ts`

## Admin NLP

### POST `/admin/nlp/upload`

Role: Admin.

Kegunaan: upload file review untuk diproses NLP.

File:

- `src/modules/nlp/nlp.controller.ts`
- `src/modules/nlp/nlp.service.ts`
- `src/modules/nlp/nlp-result-storage.service.ts`
- `src/modules/nlp/ai-naming.service.ts`
- `src/modules/nlp/utils/excel-parser.util.ts`

Form data:

| Field | Keterangan |
| --- | --- |
| `file` | File CSV/XLSX review. |
| `destinationId` | ID destinasi tujuan. |
| `textColumn` | Nama kolom teks jika berbeda dari default. |

## Catatan Response Global

Backend memakai `TransformInterceptor`, sehingga response sukses dapat dibungkus dalam format global. Error diproses oleh `HttpExceptionFilter`, sehingga error validasi biasanya berbentuk array pesan dari `class-validator`.
