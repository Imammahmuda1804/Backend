# RANAHINSIGHT Backend Service

Folder `backend` berisi service API utama berbasis NestJS. Service ini menjadi pusat autentikasi, database, destinasi, review, favorit, search, analytics, scraper, NLP processing, topic management, upload file, dan integrasi ke Python Model service.

## Kegunaan Service

Backend dipakai untuk:

- menyediakan REST API untuk web dan mobile;
- menyimpan data ke PostgreSQL melalui Prisma;
- menyimpan embedding pgvector untuk semantic search;
- mengatur login, profile, role user, dan admin;
- mengelola destinasi, foto, kategori, galeri, dan maps;
- mengelola review user dan scraped review;
- memanggil Python Model service untuk NLP;
- menyimpan hasil sentiment, confidence, topic, embedding, dan analytics;
- menjalankan scraper Google Maps melalui Apify;
- menyediakan dokumentasi API Swagger di `/api/docs`.

## Syarat Sistem

Disarankan:

- Node.js 20 atau lebih baru.
- npm sesuai bawaan Node.
- PostgreSQL dengan extension `vector`/pgvector.
- Redis untuk queue scraping/NLP.
- Python Model service aktif di port `8001` jika ingin memakai NLP.
- Apify token jika ingin menjalankan scraper.

## Instalasi dari Clone Baru

Masuk folder backend:

```powershell
cd "D:\Kuliah\Ta\New folder\backend"
```

Install dependency:

```powershell
npm install
```

Salin env:

```powershell
Copy-Item .env.example .env
```

Isi minimal `.env`:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/wisata_db
JWT_SECRET=isi-secret-panjang
JWT_REFRESH_SECRET=isi-refresh-secret-panjang
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
NLP_SERVICE_URL=http://localhost:8001
APIFY_TOKEN=isi-token-apify
REDIS_HOST=localhost
REDIS_PORT=6379
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

Generate secret aman:

```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Database dan Prisma

Pastikan PostgreSQL berjalan dan database tersedia sesuai `DATABASE_URL`.

Jalankan migration:

```powershell
npx prisma migrate dev
npx prisma generate
```

Jika database lokal boleh dihapus total:

```powershell
npx prisma migrate reset
```

Catatan:

- `prisma/schema.prisma` adalah source of truth schema.
- `prisma/migrations/` berisi migration SQL.
- Extension pgvector dibutuhkan untuk semantic search.

## Menjalankan Backend

Development:

```powershell
npm run start:dev
```

Production build:

```powershell
npm run build
npm run start:prod
```

URL default:

```txt
http://localhost:3000
```

Swagger:

```txt
http://localhost:3000/api/docs
```

Semua endpoint memiliki prefix:

```txt
/api
```

## Validasi Setelah Clone

Urutan validasi:

```powershell
cd "D:\Kuliah\Ta\New folder\backend"
npm install
npx prisma validate
npx prisma migrate status
npx prisma generate
npm run lint
npm run build
npm run start:dev
```

Cek:

```txt
GET http://localhost:3000/api
GET http://localhost:3000/api/docs
```

## Integrasi Service Lain

| Service | URL default | Keterangan |
| --- | --- | --- |
| Model Python | `http://localhost:8001` | Dipakai `NlpService` untuk embedding dan pipeline NLP. |
| Web Next.js | `http://localhost:3001` | Memanggil backend melalui Axios. |
| Mobile Flutter | IP LAN backend, contoh `http://192.168.1.10:3000` | Device fisik harus satu jaringan atau memakai `adb reverse`. |
| PostgreSQL | sesuai `DATABASE_URL` | Menyimpan data utama. |
| Redis | `localhost:6379` | Queue scraper dan NLP background. |

## Struktur Folder

| Path | Kegunaan |
| --- | --- |
| `src/main.ts` | Entrypoint NestJS, global prefix, CORS, Swagger, filter, interceptor, dan server. |
| `src/app.module.ts` | Root module yang menggabungkan semua module. |
| `src/config/` | Konfigurasi env, multer upload, dan Swagger. |
| `src/prisma/` | Prisma module/service untuk akses database. |
| `src/common/` | Decorator, guard, filter, interceptor, DTO, constants, dan utility bersama. |
| `src/modules/auth/` | Login/logout, JWT, DTO auth, dan strategy. |
| `src/modules/users/` | Profile user, update profile, avatar upload, dan admin user helper. |
| `src/modules/admin/` | Controller admin lintas domain seperti user dan moderation. |
| `src/modules/destinations/` | Public/admin destination, kategori, CRUD, media, detail, dan topic aggregation. |
| `src/modules/search/` | Keyword/semantic search, history, filter kota/kategori/topic/sentimen. |
| `src/modules/vector/` | Query pgvector dan normalisasi embedding. |
| `src/modules/nlp/` | Integrasi Python Model, penyimpanan hasil NLP, AI naming topic. |
| `src/modules/topics/` | Topic, topic group, visibility, rename, dan destination-topic query. |
| `src/modules/reviews/` | Review user dan admin review management. |
| `src/modules/favorites/` | Favorite destination user. |
| `src/modules/analytics/` | Analytics public dan admin dashboard. |
| `src/modules/scraper/` | Scraper Apify, queue, CSV/Excel export, dan processor. |
| `src/modules/uploads/` | Penyajian file upload. |
| `prisma/` | Schema dan migration database. |
| `uploads/` | File gambar destinasi/profile hasil upload lokal. |
| `test/` | E2E test NestJS. |
| `docs/`, `Requirements/`, `Plans/` | Dokumen pendukung project. |
| `BACKEND_CODE_FLOW.md` | Penjelasan flow source code backend. |
| `API_DOCUMENTATION.md` | Dokumentasi endpoint backend lengkap. |

## Swagger

Swagger disiapkan di `src/main.ts`:

```txt
SwaggerModule.setup('api/docs', app, document)
```

Hasil audit controller:

- Semua controller aktif memiliki `@ApiTags`.
- Semua controller masuk ke module yang diimport `AppModule`.
- Karena `SwaggerModule.createDocument(app, swaggerConfig)` membaca metadata NestJS, endpoint controller aktif akan muncul di `/api/docs`.

Jika endpoint baru ditambahkan, pastikan:

1. Controller diberi `@ApiTags`.
2. Method diberi decorator HTTP seperti `@Get`, `@Post`, `@Put`, `@Delete`.
3. Controller didaftarkan dalam module.
4. Module diimport ke `AppModule` atau module yang sudah diimport.
5. Tambahkan `@ApiOperation`, `@ApiResponse`, dan `@ApiBody` jika endpoint menerima body.

## Endpoint Diagnostic dan Legacy

Beberapa endpoint sengaja dipertahankan walau tidak semua dipakai UI:

- `GET /api` untuk health check cepat.
- `GET /api/test-nlp` untuk mengecek koneksi backend ke Model Python.
- `POST /api/auth/logout` untuk logout berbasis refresh token jika nanti token blacklist dipakai.
- `GET /api/destinations/:id` sebagai fallback detail by ID untuk klien lama.
- `GET /api/analytics/dashboard` sebagai endpoint analytics public cadangan.
- Endpoint moderation khusus seperti `DELETE /api/admin/moderation/reviews/:id`.

Endpoint ini tidak wajib dipasang ke frontend jika belum ada kebutuhan produk langsung.

## Perintah Penting

| Perintah | Kegunaan |
| --- | --- |
| `npm run start:dev` | Menjalankan server development. |
| `npm run build` | Build TypeScript ke `dist`. |
| `npm run start:prod` | Menjalankan hasil build. |
| `npm run lint` | Lint backend. |
| `npm test` | Unit test. |
| `npm run test:e2e` | E2E test. |
| `npx prisma migrate dev` | Menjalankan migration development. |
| `npx prisma generate` | Generate Prisma Client. |
| `npx prisma studio` | Membuka Prisma Studio. |

## Troubleshooting

### Backend tidak bisa konek database

Periksa:

- PostgreSQL aktif.
- `DATABASE_URL` benar.
- Database sudah dibuat.
- Migration sudah dijalankan.

### Semantic search gagal

Periksa:

- Python Model service aktif.
- `NLP_SERVICE_URL` benar.
- Extension pgvector aktif.
- Destination sudah punya embedding.

### Scraper tidak jalan

Periksa:

- `APIFY_TOKEN` valid.
- Redis aktif.
- Queue worker backend ikut berjalan.

### Mobile tidak bisa akses backend

Periksa:

- Backend listen di `0.0.0.0` atau host dapat diakses LAN.
- Firewall Windows membuka port 3000.
- Mobile dan laptop ada di jaringan yang sama.
- `Mobile/.env` memakai IP LAN laptop, bukan `localhost`.
