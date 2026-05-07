# 📋 Evaluasi Requirements.md — Backend NestJS

## Referensi UML yang Dievaluasi

````carousel
![Use Case Diagram](C:\Users\Acer\.gemini\antigravity\brain\1b64f1cd-1db9-4f71-92ea-4eafc60bbb9c\artifacts\use-case.png)
<!-- slide -->
![Flow Chart](C:\Users\Acer\.gemini\antigravity\brain\1b64f1cd-1db9-4f71-92ea-4eafc60bbb9c\artifacts\flow-chart.png)
<!-- slide -->
![Admin Activity Diagram](C:\Users\Acer\.gemini\antigravity\brain\1b64f1cd-1db9-4f71-92ea-4eafc60bbb9c\artifacts\admin-activity.png)
<!-- slide -->
![User Activity Diagram](C:\Users\Acer\.gemini\antigravity\brain\1b64f1cd-1db9-4f71-92ea-4eafc60bbb9c\artifacts\user-activity.png)
````

---

# BAGIAN 1: Kecocokan Requirements dengan UML

## 1.1 Mapping Fitur Pengguna (Use Case → Requirements)

| Use Case (UML) | Endpoint di Requirements | Status |
|---|---|---|
| Melihat Rekomendasi Awal | `GET /destinations/recommendations` (§20) | ✅ Cocok |
| Melakukan Pencarian Semantik | `POST /search` (§21) | ✅ Cocok |
| Melihat Detail Destinasi | `GET /destinations/:id` (§20) | ✅ Cocok |
| Melihat Rating Google & User | Termasuk di response `GET /destinations/:id` | ✅ Cocok |
| Melihat Gambar | `GET /destinations/:id` → gallery images | ✅ Cocok |
| Melihat Trailer YouTube | `GET /destinations/:id` → youtube trailer | ✅ Cocok |
| Melihat Sentimen & Topik | `GET /destinations/:id` → sentiment + topic | ✅ Cocok |
| Memberi Rating | `POST /user-reviews` (§23) | ✅ Cocok |
| Menyimpan Destinasi | `POST /favorites/:destinationId` (§22) | ✅ Cocok |
| Filter Berdasarkan Topik | `GET /topics/:id/destinations` (§26) | ✅ Cocok |
| Membandingkan Destinasi | `GET /analytics/compare` (§25) | ✅ Cocok |
| Login (Pengguna) | `POST /auth/login` (§19) | ✅ Cocok |

> [!TIP]
> Semua use case **Pengguna** sudah ter-cover dengan baik di Requirements.md. Tidak ada gap.

---

## 1.2 Mapping Fitur Admin (Use Case → Requirements)

| Use Case (UML) | Endpoint di Requirements | Status |
|---|---|---|
| Login Admin | `POST /auth/login` (§19) | ✅ Cocok |
| Melihat Dashboard | `GET /admin/dashboard/summary` (§25, §35.7) | ✅ Cocok |
| Membandingkan Dua Destinasi | `GET /analytics/compare` (§25) | ✅ Cocok |
| Melihat Detail Destinasi | `GET /admin/destinations/:id` (§35.1) | ✅ Cocok |
| Mulai Analisis | `POST /admin/scraper/process/:jobId` (§24) | ✅ Cocok |
| Scraping Google Maps | `POST /admin/scraper/start` (§24) | ✅ Cocok |
| Upload CSV | Upload rules (§27) | ⚠️ Parsial |
| Preprocessing Data | Delegated ke FastAPI `/pipeline/process` | ✅ Cocok |
| Analisis Sentimen (IndoBERT) | Delegated ke FastAPI | ✅ Cocok |
| Topic Modeling (BERTopic) | Delegated ke FastAPI | ✅ Cocok |
| Agregasi Data | `POST /admin/analytics/recalculate/:destinationId` (§35.5) | ✅ Cocok |

---

## 1.3 Mapping Flow Chart → Requirements

| Flow Step (Flowchart) | Coverage | Status |
|---|---|---|
| User/Admin branching | Role-based auth (§6) | ✅ Cocok |
| User → Homepage → Lihat Rekomendasi | `GET /destinations/recommendations` | ✅ Cocok |
| User → Pencarian → Semantic Search | `POST /search` | ✅ Cocok |
| Admin → Dashboard Entry Point | `GET /admin/dashboard/summary` | ✅ Cocok |
| Admin → Mulai Analisis → Pilih Sumber Data | Scraping + Upload flow | ✅ Cocok |
| Scraping → Simpan CSV → Preprocessing → Sentimen → Topic → Agregasi → Simpan DB | Full NLP pipeline flow (§9, §24) | ✅ Cocok |
| Admin → Lihat Detail Destinasi → Grafik | `GET /analytics/destination/:id` (§25) | ✅ Cocok |
| Admin → Bandingkan Destinasi | `GET /analytics/compare` | ✅ Cocok |
| Logout | — | ⚠️ Tidak ada endpoint |

---

## 1.4 Mapping Activity Diagrams → Requirements

### Admin Activity Diagram

| Activity Step | Coverage | Status |
|---|---|---|
| Admin Login | `POST /auth/login` | ✅ |
| Dashboard Utama | `GET /admin/dashboard/summary` | ✅ |
| Menu 1: Mulai Analisis → Pilih Sumber | Scraping + Upload | ✅ |
| Scraping Google Maps → Backend Scraping | `POST /admin/scraper/start` | ✅ |
| Upload CSV → Upload File CSV | Upload rules (§27) | ⚠️ Parsial |
| Load Data → Preprocessing → Sentimen → Topic Modeling | FastAPI delegation | ✅ |
| Agregasi Hasil → Simpan ke Database | `POST /admin/analytics/recalculate` | ✅ |
| Menu 2: Lihat Destinasi → Detail Analisis | `GET /admin/destinations/:id` | ✅ |
| Menu 3: Bandingkan Destinasi → Perbandingan Sentimen | `GET /analytics/compare` | ✅ |
| Kembali ke Dashboard (loop) | Frontend routing concern | ✅ N/A |

### User Activity Diagram

| Activity Step | Coverage | Status |
|---|---|---|
| User Membuka Website | Frontend concern | ✅ N/A |
| Sistem Menampilkan Rekomendasi (Ranking Sentimen) | `GET /destinations/recommendations` | ✅ |
| Landing Page Ditampilkan | Frontend concern | ✅ N/A |
| Pencarian → Semantic Search → Hasil | `POST /search` | ✅ |
| Filter Topik → Destinasi Sesuai Topik | `GET /topics/:id/destinations` | ✅ |
| Lihat Detail → Gambar, YouTube, Rating, Sentimen & Topik | `GET /destinations/:id` | ✅ |
| Simpan → Wishlist | `POST /favorites/:destinationId` | ✅ |
| Beri Rating | `POST /user-reviews` | ✅ |
| Bandingkan → Halaman Perbandingan | `GET /analytics/compare` | ✅ |

---

## 1.5 Gap Analysis — Ketidakcocokan UML vs Requirements

### ❌ Gap 1: Tidak Ada Endpoint Logout

> [!WARNING]
> **Flowchart** menunjukkan aksi **Logout** untuk user dan admin, tetapi Requirements.md **tidak mendefinisikan** endpoint `POST /auth/logout`.

**Rekomendasi:**
```text
Tambahkan endpoint:
  POST /auth/logout
  - Invalidate refresh token
  - Blacklist JWT (jika menggunakan token blacklist strategy)
  - Atau cukup hapus refresh token dari database
```

---

### ⚠️ Gap 2: Upload CSV Endpoint Tidak Eksplisit

> [!WARNING]
> **Admin Activity Diagram** dan **Flowchart** menunjukkan flow "Upload CSV" sebagai alternatif dari Scraping. Requirements §27 hanya mendefinisikan **rules** upload (format, max size), tetapi **tidak ada endpoint eksplisit** seperti `POST /admin/uploads/csv`.

**Rekomendasi:**
```text
Tambahkan endpoint eksplisit:
  POST /admin/destinations/:id/upload-reviews
  - Accept: multipart/form-data (CSV/XLSX/XLS)
  - Max size: 10MB
  - Max rows: 50.000
  - Flow: upload → validate → generate internal CSV → trigger FastAPI pipeline
```

---

### ⚠️ Gap 3: Endpoint Refresh Token Tidak Eksplisit

> [!IMPORTANT]
> Requirements menyebutkan "JWT Refresh Token" di §6, tetapi **tidak ada endpoint** `POST /auth/refresh` untuk mendapatkan access token baru menggunakan refresh token.

**Rekomendasi:**
```text
Tambahkan endpoint:
  POST /auth/refresh
  Body: { "refresh_token": "..." }
  Response: { "access_token": "...", "refresh_token": "..." }
```

---

### ⚠️ Gap 4: Search History — Delete Tidak Ada

> [!NOTE]
> Requirements mendefinisikan `GET /search/history` untuk melihat riwayat pencarian, tetapi tidak ada endpoint untuk **menghapus** riwayat pencarian user.

**Rekomendasi:**
```text
Opsional, tambahkan:
  DELETE /search/history       → hapus semua riwayat
  DELETE /search/history/:id   → hapus satu entry
```

---

### ⚠️ Gap 5: Favorite — Delete Tidak Eksplisit

> [!NOTE]
> Ada `POST /favorites/:destinationId` untuk menyimpan, tetapi **tidak ada endpoint** `DELETE /favorites/:destinationId` untuk un-save/unsave destinasi.

**Rekomendasi:**
```text
Tambahkan:
  DELETE /favorites/:destinationId  → hapus dari favorites
```

---

### ⚠️ Gap 6: User Profile — Endpoint GET/PUT Tidak Ada

> [!NOTE]
> Flowchart & use case mengasumsikan user memiliki akun (login), tetapi Requirements tidak mendefinisikan endpoint profil user seperti `GET /users/me` atau `PUT /users/me`.

**Rekomendasi:**
```text
Tambahkan:
  GET  /users/me         → get current user profile
  PUT  /users/me         → update name, email, password
```

---

### ✅ Hal yang Sudah Konsisten

| Aspek | Keterangan |
|---|---|
| Pemisahan NLP | Backend hanya orkestrasi, NLP sepenuhnya di FastAPI ✅ |
| Semantic Search Flow | User query → embed (FastAPI) → pgvector similarity ✅ |
| Scraping Pipeline | Admin trigger → Apify → save → CSV → FastAPI → save analytics ✅ |
| Role-based Access | ADMIN & USER role dengan JWT guard ✅ |
| Analytics & Comparison | Sentiment, topic, trend, dan comparison sudah lengkap ✅ |
| Recommendation Score | Hybrid formula (semantic + sentiment + rating) ✅ |

---

# BAGIAN 2: Evaluasi Kelayakan Technology Stack & Versi

## 2.1 Evaluasi Per Komponen

| Component | Versi Diminta | Status | Catatan |
|---|---|---|---|
| **NestJS** | 10 | ⚠️ Usable tapi outdated | NestJS **11** sudah rilis (stable 11.1.x). NestJS 10 masih bisa digunakan, tapi sudah **tidak menerima fitur baru** |
| **Node.js** | 20 LTS | ✅ Cocok | Node.js 20 LTS masih aktif dan fully supported |
| **TypeScript** | 5 | ✅ Cocok | TypeScript 5.x masih versi terbaru |
| **Prisma ORM** | (unversioned) | ⚠️ Ada limitasi | Prisma **TIDAK** mendukung native `vector` type dari pgvector. Harus pakai `Unsupported("vector")` + raw SQL |
| **PostgreSQL** | 16 | ✅ Cocok | PostgreSQL 16 fully supports pgvector extension |
| **pgvector** | (unversioned) | ✅ Cocok | Kompatibel dengan PostgreSQL 16 |
| **JWT + Passport** | (unversioned) | ✅ Cocok | `@nestjs/jwt` + `@nestjs/passport` fully compatible dengan NestJS 10 |
| **class-validator** | (unversioned) | ✅ Cocok | Standard NestJS validation, fully compatible |
| **Multer** | (unversioned) | ✅ Cocok | Built-in di `@nestjs/platform-express` |
| **Swagger** | (unversioned) | ✅ Cocok | `@nestjs/swagger` fully compatible |
| **Redis** | (optional) | ✅ Cocok | Required jika menggunakan BullMQ |
| **BullMQ** | (unversioned) | ✅ Cocok | Gunakan `@nestjs/bullmq` untuk integrasi NestJS |
| **Axios** | (unversioned) | ✅ Cocok | Tapi NestJS punya `@nestjs/axios` (HttpModule) yang lebih idiomatic |
| **@nestjs/config** | (unversioned) | ✅ Cocok | Standard config management |
| **Apify API** | (unversioned) | ✅ Cocok | REST API, diakses via Axios/HttpModule |

---

## 2.2 Isu Kritis yang Harus Diperhatikan

### 🔴 Isu Kritis 1: Prisma + pgvector — Native Vector Type Tidak Didukung

> [!CAUTION]
> Prisma ORM **tidak mendukung** tipe data `vector` secara native. Kolom `embedding VECTOR(384)` di tabel `destinations` dan `review_embeddings` **tidak bisa dimanipulasi** menggunakan Prisma Client biasa.

**Dampak:**
- Schema harus menggunakan `Unsupported("vector")` untuk field embedding
- Semua operasi vector (insert, similarity search) **wajib menggunakan** `prisma.$queryRaw` / `prisma.$executeRaw`
- Tidak bisa menggunakan `findMany`, `create`, `update` untuk field embedding
- Migration harus dikustomisasi manual untuk `CREATE EXTENSION vector`

**Rekomendasi — 2 Opsi:**

| Opsi | Pendekatan | Pro | Kontra |
|---|---|---|---|
| **A** | Tetap Prisma + Raw SQL | Konsisten dengan stack, ekosistem NestJS baik | Boilerplate tinggi, tidak type-safe untuk vector ops |
| **B** | Prisma untuk tabel biasa + **Drizzle ORM** / **raw `pg`** khusus vector ops | Type-safe, dedicated vector handling | Dua ORM dalam satu project, sedikit lebih kompleks |

**Rekomendasi terbaik:** Gunakan **Opsi A** — tetap Prisma untuk semua tabel, lalu buat **dedicated VectorService** yang menggunakan `prisma.$queryRawUnsafe` atau `prisma.$queryRaw` untuk semua operasi pgvector. Ini menjaga konsistensi arsitektur.

```typescript
// Contoh VectorService pattern
@Injectable()
export class VectorService {
  constructor(private prisma: PrismaService) {}

  async similaritySearch(queryVector: number[], limit: number) {
    return this.prisma.$queryRaw`
      SELECT id, name, 
             embedding <-> ${JSON.stringify(queryVector)}::vector AS distance
      FROM destinations
      ORDER BY distance
      LIMIT ${limit}
    `;
  }
}
```

---

### 🟡 Isu 2: NestJS 10 vs NestJS 11

> [!WARNING]
> NestJS **11** sudah dirilis sebagai versi stable (11.1.x). NestJS 10 masih bisa digunakan tetapi sudah memasuki fase **maintenance-only** — tidak ada fitur baru, hanya security patches.

**Rekomendasi:**

| Jika... | Maka... |
|---|---|
| Proyek baru (belum mulai coding) | **Gunakan NestJS 11** — Node.js 20 sudah kompatibel |
| Proyek sudah berjalan di NestJS 10 | Tetap di NestJS 10, upgrade nanti setelah MVP selesai |

---

### 🟡 Isu 3: Redis Disebut "Optional" tapi BullMQ Wajib

> [!IMPORTANT]
> Requirements menyebutkan Redis sebagai **(optional)** di technology stack (§2.1), tetapi di §33 menyatakan BullMQ **wajib** digunakan untuk scraping jobs, NLP processing, dan analytics generation. BullMQ **membutuhkan Redis** sebagai backend — jadi **Redis TIDAK optional**.

**Rekomendasi:**
```diff
- | Cache | Redis (optional) |
+ | Cache & Queue Backend | Redis (REQUIRED) |
```

---

### 🟡 Isu 4: Library `pg` Redundan dengan Prisma

> [!NOTE]
> Requirements §29 mencantumkan library `pg` (node-postgres) di daftar required libraries. Jika menggunakan Prisma sebagai ORM utama, library `pg` **tidak diperlukan** karena Prisma sudah memiliki driver PostgreSQL built-in. Prisma `$queryRaw` sudah cukup untuk operasi pgvector.

**Rekomendasi:**
- Hapus `pg` dari daftar library **kecuali** ada kebutuhan spesifik di luar Prisma (misalnya connection pooling PgBouncer terpisah)

---

### 🟡 Isu 5: Axios vs @nestjs/axios (HttpModule)

> [!TIP]
> Requirements mencantumkan `axios` sebagai library terpisah. Dalam ekosistem NestJS, lebih baik menggunakan `@nestjs/axios` yang menyediakan `HttpModule` dan `HttpService` — ini lebih idiomatic, mendukung dependency injection, dan testable.

**Rekomendasi:**
```diff
Required Libraries:
- axios
+ @nestjs/axios
```

---

### 🟢 Isu Minor: Library Tambahan yang Sebaiknya Ditambahkan

> [!NOTE]
> Beberapa library yang disebutkan di security requirements (§6) **tidak ada** di daftar required libraries (§29).

```diff
Required Libraries (tambahan):
+ helmet                    → security headers (disebutkan di §6)
+ @nestjs/throttler         → rate limiting (disebutkan di §6)
+ @nestjs/axios             → HTTP client (pengganti axios)
+ @nestjs/bullmq            → NestJS BullMQ integration
+ csv-parser / papaparse    → CSV parsing untuk upload & internal CSV
+ xlsx                      → Excel file parsing (§27 mendukung xlsx/xls)
```

---

## 2.3 Ringkasan Evaluasi Technology Stack

| Kategori | Verdict |
|---|---|
| **Framework (NestJS 10)** | ⚠️ Usable, tapi pertimbangkan upgrade ke **NestJS 11** |
| **Runtime (Node.js 20)** | ✅ Fully supported |
| **Language (TypeScript 5)** | ✅ Fully supported |
| **ORM (Prisma)** | ⚠️ Butuh workaround untuk pgvector (`$queryRaw`) |
| **Database (PostgreSQL 16 + pgvector)** | ✅ Fully supported |
| **Auth (JWT + Passport)** | ✅ Fully compatible |
| **Queue (BullMQ)** | ✅ Compatible, tapi Redis harus **REQUIRED** |
| **Scraping (Apify API)** | ✅ REST API, tidak ada isu |
| **Overall Stack** | ✅ **Layak diimplementasikan** dengan catatan di atas |

---

# Ringkasan Rekomendasi Prioritas

| # | Prioritas | Rekomendasi |
|---|---|---|
| 1 | 🔴 Kritis | Siapkan **VectorService** pattern untuk Prisma + pgvector raw SQL |
| 2 | 🟡 Tinggi | Tambahkan endpoint **`POST /auth/logout`** dan **`POST /auth/refresh`** |
| 3 | 🟡 Tinggi | Tambahkan endpoint **`POST /admin/destinations/:id/upload-reviews`** |
| 4 | 🟡 Tinggi | Ubah Redis dari "optional" menjadi **REQUIRED** |
| 5 | 🟡 Sedang | Pertimbangkan upgrade ke **NestJS 11** jika proyek belum mulai |
| 6 | 🟢 Minor | Tambahkan endpoint `DELETE /favorites`, `GET/PUT /users/me` |
| 7 | 🟢 Minor | Gunakan `@nestjs/axios` dan `@nestjs/bullmq` (bukan bare axios/bullmq) |
| 8 | 🟢 Minor | Tambahkan library `helmet`, `@nestjs/throttler`, `csv-parser`, `xlsx` ke daftar |
