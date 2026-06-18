# Dokumentasi Flow Kode Backend RANAHINSIGHT

Dokumen ini menjelaskan struktur folder `backend`, alur kerja kode, dan fungsi komentar Bahasa Indonesia yang ditambahkan pada bagian core backend. Target pembaca adalah orang yang belum terbiasa memakai NestJS, Prisma, PostgreSQL, pgvector, BullMQ, atau pola backend modular.

## Peran Folder Backend

Folder `backend` adalah API utama RANAHINSIGHT. Tugasnya:

1. menerima request dari web dan mobile;
2. mengatur autentikasi dan role user;
3. membaca dan menulis data PostgreSQL lewat Prisma;
4. menghubungkan backend dengan service Python `Model`;
5. menyimpan hasil NLP seperti sentimen, confidence, topik, dan embedding;
6. menyediakan search, detail destinasi, compare, profile, favorite, review, scraper, dan dashboard admin.

Backend adalah pusat orkestrasi. Python `Model` hanya memproses NLP, sedangkan penyimpanan dan kontrak API tetap di backend.

## Struktur Folder Utama

### `backend/src/main.ts`

Posisi pada flow: entrypoint aplikasi NestJS.

Kegunaan:

- membuat aplikasi NestJS;
- memasang prefix `/api`;
- memasang Helmet, CORS, filter error, response interceptor, validation pipe, dan Swagger;
- menjalankan server HTTP.

Komentar penting:

- `bootstrap`: menjelaskan fungsi setup global aplikasi sampai server berjalan.

### `backend/src/app.module.ts`

Posisi pada flow: root module NestJS.

Kegunaan:

- mendaftarkan semua module fitur;
- memasang `ConfigModule`, `PrismaModule`, `BullModule`, `ServeStaticModule`, dan `ThrottlerModule`;
- memasang guard global JWT dan role.

Komentar penting:

- `AppModule`: menjelaskan bahwa class ini adalah penggabung semua module dan guard global.

### `backend/src/config`

Posisi pada flow: konfigurasi aplikasi.

File penting:

- `env.config.ts`: mengaktifkan config global dan validasi env.
- `env.validation.ts`: memvalidasi env wajib seperti `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, port, URL FastAPI, dan CORS.
- `multer.config.ts`: konfigurasi upload file.
- `swagger.config.ts`: konfigurasi dokumentasi Swagger.

Komentar penting:

- `parsePort`: menjelaskan validasi port.
- `validateUrl`: menjelaskan validasi URL env.
- `validateCommaSeparatedOrigins`: menjelaskan validasi daftar CORS.
- `validateEnv`: menjelaskan validasi env sebelum backend start.

### `backend/src/prisma`

Posisi pada flow: akses database.

File penting:

- `../../prisma/seed.ts`: seeder database untuk admin awal dan topic group bawaan.
- `prisma.module.ts`: membuat Prisma tersedia global.
- `prisma.service.ts`: membuat Prisma Client dengan adapter PostgreSQL Prisma v7.

Komentar penting:

- `PrismaModule`: menjelaskan penyediaan Prisma sebagai dependency global.
- `PrismaService`: menjelaskan lifecycle koneksi database.
- `constructor`: membuat client Prisma dengan adapter PostgreSQL.
- `onModuleInit`: membuka koneksi database.
- `onModuleDestroy`: menutup koneksi database.

Flow seed:

- perintah `npm run db:seed` menjalankan `prisma/seed.ts`;
- file `.env` dibaca untuk `DATABASE_URL`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_NAME`, `SEED_ADMIN_PASSWORD`, dan `SEED_ADMIN_RESET_PASSWORD`;
- `seedAdmin()` membuat admin baru jika email belum ada;
- jika admin sudah ada, role dipastikan `ADMIN` dan status `active`;
- password admin lama dipertahankan kecuali `SEED_ADMIN_RESET_PASSWORD=true`;
- `seedTopicGroups()` membuat atau memperbarui group topik awal untuk tampilan broad topic.

## Module Feature

### `backend/src/modules/auth`

Posisi pada flow: login, register, login Google, refresh token, dan logout.

Kegunaan:

- membuat JWT access token dan refresh token;
- memvalidasi password dengan bcrypt;
- memverifikasi Google ID token dengan `google-auth-library`;
- melakukan auto-link akun Google berdasarkan `googleId` atau email Google yang sudah verified;
- memastikan status akun aktif;
- menyediakan strategy JWT untuk guard global.

Alur:

1. Frontend mengirim email/password.
2. `AuthController` meneruskan ke `AuthService`.
3. `AuthService` cek user, password, status, lalu buat token.
4. Token dipakai request berikutnya melalui header `Authorization`.

Alur Google:

1. Web/mobile memperoleh Google `idToken` dari OAuth client.
2. Client mengirim `POST /api/auth/google` dengan body `{ "id_token": "..." }`.
3. `AuthService` validasi audience dari `GOOGLE_CLIENT_IDS` atau `GOOGLE_WEB_CLIENT_ID`.
4. Jika user belum ada, backend membuat akun role `USER`; jika email sudah ada, backend menautkan `googleId`.
5. Backend mengembalikan response token yang sama seperti login biasa.

### `backend/src/modules/users`

Posisi pada flow: profile user dan admin user management.

Kegunaan:

- membaca data user saat login;
- memperbarui profile;
- upload avatar;
- admin membuat/mengubah status user.

### `backend/src/modules/destinations`

Posisi pada flow: pusat data destinasi.

Kegunaan:

- CRUD destinasi admin;
- list dan detail destinasi public;
- kategori dan kota;
- thumbnail dan gallery;
- rekomendasi dan ranking;
- review berdasarkan topic atau topic group;
- agregasi rating user, rating scraping, topic sentiment, dan topic group.

Komentar penting:

- `DestinationsService`: facade yang menjaga kontrak lama controller.
- `DestinationAdminService`: CRUD, maps, dan media admin.
- `DestinationCatalogService`: list, filter, kota, kategori, rekomendasi, dan ranking.
- `DestinationDetailService`: detail public/admin, ulasan berdasarkan topik, dan agregasi topik/sentimen.
- `create`: membuat destinasi dan slug.
- `findAll`: list destinasi dengan pagination/filter.
- `getCategories`: daftar kategori tetap.
- `getCities`: daftar kota aktif.
- `findOneAdmin`: detail admin.
- `update`, `softDelete`, `updateMapsUrl`: perubahan data destinasi.
- `uploadThumbnail`, `uploadImage`, `deleteImage`: flow media.
- `findRecommendations`, `findRanking`: rekomendasi/ranking public, termasuk deskripsi untuk hero/timecard frontend.
- `findOnePublic`, `findOnePublicBySlug`: detail public.
- `getReviewsByTopic`, `getReviewsByTopicGroup`: ulasan berdasarkan topik.
- `buildTopicGroups`: pengelompokan topik sempit ke group luas.
- `buildTopicSentimentBreakdown`: hitung sentimen per topik.
- `removeFileIfExists`: cleanup file lokal.

Alur detail destinasi:

1. Web/mobile memanggil `/api/destinations/:slug`.
2. Controller meneruskan ke `DestinationsService`.
3. Service mengambil destinasi, gambar, trend, topic, dan review user.
4. Service menghitung rating user, rating scraping, topic sentiment, dan topic group.
5. Response dikirim ke frontend.

### `backend/src/modules/search`

Posisi pada flow: semantic search.

Kegunaan:

- menerima query natural language;
- meminta embedding query ke service Python;
- menjalankan pgvector search;
- menerapkan filter kota, kategori, topik, rating, dan sentimen;
- menyimpan history jika user login;
- menambahkan top 3 topic ke hasil destinasi.

Komentar penting:

- `SearchController`: endpoint pencarian dan riwayat.
- `search`: menjalankan semantic search.
- `getHistory`: mengambil riwayat pencarian.
- `clearHistory`: menghapus semua riwayat.
- `deleteHistoryEntry`: menghapus satu riwayat setelah validasi kepemilikan.
- `SearchService`: logic semantic search dan history.
- `attachTopTopics`: menambahkan topik dominan ke result.

Alur semantic search:

1. Frontend mengirim query ke `/api/search`.
2. `SearchController` membaca user optional dari token.
3. `SearchService` memanggil `NlpService.embedQuery`.
4. `VectorService.hybridSearch` mencari destinasi dari embedding.
5. `SearchService` menambahkan top topic dan menyimpan history.
6. Result dikirim ke frontend.

### `backend/src/modules/vector`

Posisi pada flow: operasi pgvector.

Kegunaan:

- menyimpan embedding review;
- menyimpan embedding destinasi;
- menjalankan similarity/hybrid search.

Komentar penting:

- `VectorService`: menjelaskan service pgvector.
- `chunkArray`: memecah batch.
- `upsertDestinationEmbedding`: update embedding destinasi.
- `insertReviewEmbedding`: insert/update embedding review.
- `batchInsertReviewEmbeddings`: batch embedding review.
- `searchSimilarDestinations`: search similarity murni.
- `hybridSearch`: search similarity + rating + sentimen + filter.

### `backend/src/modules/nlp`

Posisi pada flow: jembatan backend ke Python `Model`.

Kegunaan:

- upload file review admin;
- parse file;
- simpan review mentah;
- kirim data ke FastAPI;
- simpan hasil sentimen, confidence, topik, embedding, score, dan trend;
- generate nama topic dengan AI.

Komentar penting:

- `NlpController`: endpoint admin NLP processing, preflight file, dan history run. Controller ini hanya menerima HTTP request dan meneruskan kerja ke service.
- `NlpUploadService`: facade flow upload yang dipakai controller.
- `NlpUploadPreparationService`: validasi destinasi/file, parsing review, hash file/review, dan preflight.
- `NlpProcessingHistoryService`: membuat, membaca, dan mengubah status processing run.
- `NlpPipelineRunnerService`: membuat CSV internal, memanggil FastAPI, dan menolak hasil pipeline kosong/tanpa topik.
- `NlpUploadExecutionService`: menjalankan mode proses, storage hasil, rating refresh, rollback, dan response akhir.
- `NlpReviewDedupService`: aturan review baru/duplikat/proses ulang berdasarkan `review_hash`, termasuk recovery saat unique constraint sudah terlanjur terjadi.
- `ExcelParserUtil`: parser file upload. Utility ini memisahkan deteksi Excel/CSV, pembacaan header, mapping kolom, parsing baris review, dan normalisasi tanggal Indonesia.
- `preflight`: cek hash file/review sebelum proses agar admin melihat review baru dan duplikat.
- `uploadAndProcess`: proses file review dengan mode `skip_existing`, `reprocess_existing`, atau `replace_existing`.
- `NlpService`: client HTTP ke FastAPI.
- `embedQuery`: meminta embedding query.
- `healthCheck`: cek kesehatan FastAPI.
- `handleAxiosError`: mapping error Axios ke exception backend.
- `NlpResultStorageService`: facade urutan penyimpanan hasil pipeline.
- `NlpTopicStorageService`: menyimpan topik model, mencari topik kanonis, dan mencegah nama topik duplikat.
- `TopicModelMappingService`: memisahkan `topic_id` milik satu hasil training model dari ID topik kanonis database. Identitas model dibentuk dari `topic_model_version + topic_trained_at`.
- `NlpReviewStorageService`: update review, topic primer, assignment
  multi-aspek, dan embedding.
- `NlpDestinationAnalyticsStorageService`: menghitung ulang score, topic, trend, dan embedding destinasi.
- `ReviewTopicPersistenceService`: replace/move assignment multi-aspek dalam
  transaction.
- `ReviewTopicQueryService`: query terpusat untuk count, sentiment, dan
  pagination review berdasarkan aspek.
- `logPipelineResult`: mencatat ringkasan pipeline lewat helper kecil agar log summary, topik baru, warning, dan metadata tidak bercampur dengan logic simpan data.
- `saveTopics`: upsert topic dari hasil NLP.
- `updateReviews`: update sentiment, confidence, cleaned text, dan topic.
- `saveReviewEmbeddings`: simpan embedding review.
- `saveDestinationEmbedding`: hitung embedding destinasi.
- `calculateRecommendationScore`: hitung recommendation score.
- `updateDestinationTopics`: agregasi topic per destinasi.
- `updateSentimentTrends`: agregasi sentiment trend bulanan.
- `AiNamingService`: fallback model, throttle, retry, dan quota Gemini.
- `TopicNamePolicyService`: prompt, fallback label, sanitasi, dan validasi nama topik.
- `TopicGroupClassifierService`: pemetaan nama/keyword topik ke topic group.

Alur NLP upload:

1. Admin upload file review ke `/api/admin/nlp/upload`.
2. `NlpController` hanya menerima HTTP request dan meneruskan input ke facade `NlpUploadService`.
3. `NlpUploadPreparationService` validasi destinasi dan file, lalu menghitung `file_hash` dan `review_hash`.
4. `NlpProcessingHistoryService` membuat `nlp_processing_runs` untuk history proses.
5. `NlpReviewDedupService` menentukan review baru, review duplikat, dan review existing yang perlu diproses ulang.
6. Mode `skip_existing` hanya menyimpan review baru, `reprocess_existing` menghitung ulang review yang sudah ada, dan `replace_existing` mengganti data scraping destinasi.
7. `NlpPipelineRunnerService` membuat CSV sementara untuk review yang benar-benar diproses.
8. `NlpService.processPipeline` mengirim file ke FastAPI.
9. Python mengembalikan sentiment, confidence, topic, embedding, serta metadata versi dan waktu training model.
10. Backend menolak hasil kosong atau hasil tanpa topik agar run tidak terlihat sukses saat Model mati atau BERTopic gagal dimuat.
11. `NlpTopicStorageService` mencari mapping `(identitas model, model topic ID)`. Mapping existing langsung memakai topik kanonis; mapping baru diselesaikan melalui nama AI/topik existing lalu disimpan permanen.
12. `NlpReviewStorageService` mempertahankan `topic_id` primer pada tabel
    `reviews`, lalu menyimpan seluruh `topic_assignments` ke
    `review_topics`.
13. `NlpResultStorageService` mengatur urutan provider penyimpanan topic,
    review/embedding, dan analytics destinasi.

### Flow Aspect-Based Topic Assignment

1. Model mengirim satu `topic_id` primer dan maksimal tiga
   `topic_assignments`.
2. Backend memetakan setiap topic ID model ke topic kanonis melalui
   `TopicModelMappingService`.
3. Assignment yang menuju topic kanonis sama digabung dengan score tertinggi.
4. `reviews.topic_id` tetap menyimpan topic primer untuk kompatibilitas.
5. `review_topics` menyimpan topic primer dan sekunder beserta `score`,
   `is_primary`, dan `assignment_method`.
6. Detail destinasi, ulasan per topic, risk matrix, dan recalculation membaca
   aspek melalui `ReviewTopicQueryService`.
7. `destination_topics.total_reviews` dihitung dari semua assignment unik.
8. Merge topic memindahkan assignment source ke target sebelum source dihapus.

### `backend/src/modules/topics`

Posisi pada flow: manajemen topik NLP.

Kegunaan:

- list topic untuk search;
- list topic group untuk detail;
- rename topic;
- update group dan visibility topic;
- delete topic;
- mencari destinasi berdasarkan topic.

Komentar penting:

- `TopicsService`: facade stabil yang dipakai controller.
- `TopicQueryService`: daftar topic/group dan destinasi per topic.
- `TopicReviewService`: ulasan, pagination, filter, dan ringkasan sentimen per topic.
- `TopicMergeService`: pencarian nama normal, pemindahan relasi, pemindahan mapping model, dan merge keyword.
- `TopicGroupService`: CRUD topic group.
- `TopicManagementService`: rename AI/manual, visibility/group topic, dan delete.
- `renameUnnamedTopics`: rename topic fallback memakai AI.
- `mergeTopics`: menggabungkan review primer, assignment multi-aspek, relasi
  destinasi, keyword, dan seluruh mapping model dari beberapa topic source ke
  satu topic target.
- `createGroup`, `updateGroup`, `deleteGroup`: CRUD topic group luas untuk taxonomy admin.
- `findAll`: topic atau topic group sesuai scope.
- `findGroups`: semua group dan topic di dalamnya.
- `findDestinationsByTopic`: destinasi berdasarkan topic.
- `findReviewsByTopic`: ulasan berdasarkan topic untuk drawer inspeksi admin.
- `renameTopic`: rename manual topic.
- `updateTopicSettings`: ubah group/visibility.
- `renameGroup`: rename group luas.
- `deleteTopic`: hapus topic dan unlink relasi.

### `backend/src/modules/scraper`

Posisi pada flow: scraping data review.

Kegunaan:

- menjalankan Apify scraping;
- membuat job;
- menyimpan history;
- mengubah hasil scraping ke CSV;
- memicu NLP processor.

Catatan struktur:

- `ScraperService` membuat job dan membaca status/history/download.
- `ScraperProcessor` menjalankan job queue: start job, ambil rating Google, scrape review, filter review berteks, dan mencatat sukses/gagal.
- `ScraperWorkbookService` membuat, memberi style, menyimpan, dan menyalin workbook Excel hasil scraping.
- `NlpProcessProcessor` mengubah review scraping menjadi CSV internal, memanggil FastAPI, lalu memakai `NlpResultStorageService` untuk menyimpan hasil NLP.
- Masing-masing tahap worker dibuat sebagai helper bernama agar pembaca baru bisa mengikuti flow tanpa membaca satu fungsi besar.

### `backend/src/modules/reviews`

Posisi pada flow: manajemen review.

Kegunaan:

- admin melihat dan menghapus review scraping;
- user aplikasi membuat review sendiri;
- review user dipakai untuk rating RanahInsight.

### `backend/src/modules/analytics`

Posisi pada flow: dashboard dan insight admin.

Kegunaan:

- dashboard summary;
- trend sentiment;
- compare analytics;
- risk topic;
- insight review/destination.

Catatan struktur:

- `AnalyticsService` adalah facade yang mempertahankan method lama controller.
- `DashboardAnalyticsService` dan `PublicDashboardAnalyticsService` menangani dashboard admin/public.
- `DestinationAnalyticsService` menangani analytics satu destinasi.
- `DestinationComparisonService` dan `DestinationComparisonInsightsService` menangani compare serta insight keputusan.
- `AnalyticsExportService` menangani CSV, sedangkan `AnalyticsRecalculationService` menghitung ulang data turunan.
- Response tetap memakai field lama agar web/mobile tidak perlu diubah saat refactor internal.

### `backend/src/modules/favorites`

Posisi pada flow: daftar favorit user.

Kegunaan:

- tambah favorit lewat `POST /api/favorites/:destinationId`;
- hapus favorit lewat `DELETE /api/favorites/:destinationId` secara idempotent;
- cek status favorit;
- list favorit user.

### `backend/src/modules/routes`

Posisi pada flow: rute wisata, itinerary, share route, dan saved route.

Kegunaan:

- katalog route publik lewat `GET /api/routes/public`;
- detail route shareable lewat `GET /api/routes/share/:shareSlug`;
- custom route user lewat `POST /api/routes`;
- route tersimpan dan progress kunjungan lewat `GET /api/routes/saved` dan endpoint progress;
- simpan, unsave, dan duplicate route user lain;
- curated route admin lewat `/api/admin/routes`;
- auto sort destinasi memakai koordinat dan Haversine.

Flow:

- user/admin memilih destinasi untuk route;
- backend mengambil koordinat destinasi aktif;
- jika `autoSort=true`, urutan dihitung dengan nearest-neighbor sederhana;
- jarak antar stop dan estimasi durasi disimpan di route;
- route public/link-only bisa dibuka, disimpan, dan diduplikasi user lain.

Catatan struktur:

- `RoutesService` adalah facade controller.
- `RouteAccessService` memeriksa visibility, ownership, saved route, dan stop route.
- `RouteQueryService` menangani katalog public, route user, saved route, dan list admin.
- `SavedRouteProgressService` menangani status kunjungan stop.
- `RoutePlanningService` memvalidasi stop, menghitung Haversine, nearest-neighbor, kota, dan durasi.
- `RouteManagementService` menangani create/update/delete/save/duplicate/publish.

### `backend/src/modules/uploads`

Posisi pada flow: upload dan parsing file.

Kegunaan:

- upload file umum;
- parsing file untuk admin/NLP;
- validasi file input.

## Alur End-to-End Utama

### Flow Search

1. User web/mobile memasukkan query.
2. Backend menerima query di `SearchController`.
3. `SearchService` memanggil `NlpService.embedQuery`.
4. Python `Model` mengembalikan embedding.
5. `VectorService.hybridSearch` mencari destinasi dengan pgvector.
6. Backend menambahkan topic dominan dan menyimpan history jika user login.
7. Web/mobile bisa menghapus satu history atau membersihkan semua history lewat endpoint search history.

### Flow Detail Destinasi

1. Frontend membuka halaman detail.
2. `DestinationsController` memanggil `DestinationsService`.
3. Service mengambil data destinasi, gambar, review, topic, trend.
4. Service menghitung rating dan sentiment breakdown.
5. Response dipakai frontend untuk hero, metric, gallery, topic map, dan review.

### Flow NLP Processing

1. Admin memilih destinasi dan upload file review.
2. Web memanggil `/api/admin/nlp/preflight` untuk melihat total baris, review baru, review duplikat, dan file yang pernah diproses.
3. Admin memilih mode proses. Default `skip_existing` agar file yang sama tidak membuat review duplikat.
4. Backend membuat `NlpProcessingRun`, lalu `NlpReviewDedupService` menyimpan/memilih review target berdasarkan `review_hash`.
5. Backend mengirim review target ke Python `Model`.
6. Python mengembalikan hasil NLP.
7. Jika service Model gagal atau hasil tidak memuat topik untuk review target, backend menandai run sebagai `failed` agar analisis kosong tidak tersimpan sebagai sukses.
8. Backend memakai `topic_model_version` dan `topic_trained_at` sebagai identitas hasil training. Nomor topik yang sama dari dua hasil training berbeda tidak dianggap sebagai topik yang sama.
9. Saat nama topic hasil AI sama dengan topic existing, backend memetakan review ke topic existing agar tidak membuat nama topic duplikat.
10. Backend menyimpan mapping model-ke-topik kanonis, topic, sentiment confidence, embedding, score, dan trend, lalu menandai run sebagai `completed` atau `failed`.
11. Data unik tersebut dipakai search, detail, compare, dashboard admin, dan history NLP.

### Flow Topic Two-Level

### Flow Merge Topic

1. Admin membuka halaman `/admin/topics`.
2. Admin memilih topic target dan satu atau lebih topic source.
3. `TopicsController` menerima `POST /api/topics/merge`.
4. `TopicsService.mergeTopics` memindahkan review primer, assignment
   `review_topics`, dan relasi `destination_topics` source ke target.
5. Semua baris `topic_model_mappings` yang menunjuk source dipindahkan ke target sebelum source dihapus.
6. Keyword source digabung ke target, lalu topic source dihapus.
7. NLP berikutnya tetap menuju target karena mapping model tidak ikut hilang atau dibuat ulang.
8. Rename manual atau AI naming yang menghasilkan nama topic existing memakai flow merge yang sama.

### Flow Ulasan Berdasarkan Topic

1. Admin membuka `/admin/topics` dan menekan aksi ulasan pada satu topic.
2. Web memanggil `GET /api/admin/topics/:id/reviews` dengan filter sentimen/pagination.
3. `AdminTopicsController` meneruskan query ke `TopicsService.findReviewsByTopic`.
4. Service mengambil review dari `review_topics`, sehingga topic sekunder juga
   ikut ditemukan, lalu menghitung ringkasan sentimen dan data destinasi.
5. Drawer admin menampilkan ulasan secara lazy-load agar table taxonomy tetap ringan.

### Flow CRUD Topic Group

1. Admin membuka `/admin/topics`.
2. Panel topic group memanggil endpoint `POST`, `PUT`, atau `DELETE /api/topics/groups`.
3. Backend membuat, memperbarui, atau menghapus topic group luas.
4. Jika group dihapus, relasi topic menjadi `null` sehingga topic tidak ikut terhapus.

5. Python memberi topic sempit dari BERTopic.
6. Backend menamai topic dan memetakan ke topic group.
7. Search memakai topik/kategori sesuai kebutuhan UI.
8. Detail memakai topic group untuk ringkasan luas.
9. Admin bisa rename topic, rename group, mengatur visibility, dan melihat destinasi yang terkait topic.

### Flow Scraper Operations

1. Admin mencari tempat Google Maps dari halaman scraper jika URL Maps belum jelas.
2. Admin memilih destinasi, mengisi URL Maps, lalu memilih batas ulasan atau mode seluruh ulasan.
3. `ScraperService` membuat job dan mengirim task ke queue. Jika `fetch_all_reviews` aktif, `maxReviews` tidak dikirim ke Apify sehingga scraper mencoba mengambil semua ulasan berteks.
4. Worker scraping memproses job, menyimpan history, dan menyiapkan file hasil.
5. Admin memantau status job, membuka detail job, melihat history scraping, dan mengunduh Excel.

### Flow Clean Code dan Audit Fallow

1. Endpoint dan DTO tetap menjadi kontrak publik. Refactor internal tidak boleh mengubah URL, body, atau response tanpa update web/mobile.
2. Facade mempertahankan method publik lama, sedangkan provider kecil memegang satu domain kerja.
3. Logic branching dan mapping dipindahkan ke helper bernama jelas supaya alur utama dapat dibaca dari atas ke bawah.
4. Validasi akhir backend memakai `npx tsc --noEmit`, ESLint, dan `npx fallow health`.
5. Target audit Fallow: tidak ada finding complexity/CRAP, dead file/export, circular dependency, atau duplication; health grade tetap A.

## Catatan Untuk Pembaca Baru NestJS

- `Controller` menerima HTTP request.
- `Service` menjalankan business logic.
- `Module` mengelompokkan controller dan service.
- `DTO` mendefinisikan bentuk input dan validasi.
- `Guard` mengatur akses login/role.
- `Interceptor` mengubah response.
- `Filter` mengubah error menjadi format standar.
- `PrismaService` adalah pintu akses database.
- `@Injectable()` berarti class bisa diinjeksi sebagai dependency.

## Catatan Batasan Dokumentasi Tahap Ini

Komentar kode tahap ini difokuskan pada flow backend inti: bootstrap, config, Prisma, destination, search, vector, NLP, dan topics. Module lain tetap dijelaskan di dokumen ini agar pembaca memahami posisi foldernya, tetapi komentar inline detail untuk semua endpoint admin/review/scraper/analytics akan lebih aman dilakukan pada batch backend lanjutan.

## Indeks File Berpengaruh dan Referensi Baris

Bagian ini memetakan file backend yang berpengaruh terhadap flow API, database, NLP, search, admin, dan data yang tampil di web/mobile. Referensi baris menunjuk entrypoint class/fungsi utama.

### Bootstrap, Config, dan Infrastruktur

| Path                                                                     | Posisi pada flow        | Kegunaan                                                                                                            | Referensi baris utama                                                               |
| ------------------------------------------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `backend/src/main.ts`                                                    | Entrypoint NestJS       | Membuat aplikasi, memasang CORS, global pipe, filter, interceptor, Swagger, dan menjalankan server.                 | `bootstrap` `main.ts:12`                                                            |
| `backend/src/app.module.ts`                                              | Root module             | Menggabungkan module domain seperti auth, destinations, search, NLP, topics, scraper, review, analytics, dan admin. | `AppModule` `app.module.ts:117`                                                     |
| `backend/src/config/env.config.ts`                                       | Konfigurasi environment | Mengaktifkan `ConfigModule` dan validasi env agar backend gagal lebih awal jika konfigurasi penting hilang.         | `envConfig` `env.config.ts:4`                                                       |
| `backend/src/config/env.validation.ts`                                   | Validasi env            | Memvalidasi `DATABASE_URL`, JWT secret, URL service NLP, CORS, Redis, dan port.                                     | `validateEnv` `env.validation.ts:58`                                                |
| `backend/src/config/swagger.config.ts`                                   | Dokumentasi API         | Menyiapkan metadata Swagger untuk eksplorasi endpoint backend.                                                      | `swaggerConfig` `swagger.config.ts:3`                                               |
| `backend/src/config/multer.config.ts`                                    | Upload file             | Menentukan filter dan limit upload gambar, CSV, serta foto profile.                                                 | `imageFileFilter` `multer.config.ts:29`, `multerImageOptions` `multer.config.ts:57` |
| `backend/src/prisma/prisma.module.ts`                                    | Database module         | Mengekspor `PrismaService` agar bisa dipakai semua module.                                                          | `PrismaModule` `prisma.module.ts:11`                                                |
| `backend/src/prisma/prisma.service.ts`                                   | Database client         | Membungkus Prisma Client dan mengatur koneksi database.                                                             | `PrismaService` `prisma.service.ts:8`                                               |
| `backend/prisma/schema.prisma`                                           | Source of truth schema  | Mendefinisikan model database, relasi, enum, dan field pgvector/raw SQL pendukung.                                  | Baca bersama migration baseline                                                     |
| `backend/prisma/migrations/20260521000000_baseline_schema/migration.sql` | Baseline database       | Membuat extension, tabel, index, dan foreign key saat database dibuat ulang.                                        | Baca dari atas ke bawah sesuai urutan SQL                                           |

### Common Layer

| Path                                                       | Posisi pada flow  | Kegunaan                                                                 | Referensi baris utama                                                            |
| ---------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `backend/src/common/decorators/public.decorator.ts`        | Auth bypass       | Memberi metadata endpoint public agar tidak ditahan global JWT guard.    | `Public` `public.decorator.ts:6`                                                 |
| `backend/src/common/decorators/roles.decorator.ts`         | Role metadata     | Menandai endpoint yang butuh role tertentu.                              | `Roles` `roles.decorator.ts:6`                                                   |
| `backend/src/common/decorators/current-user.decorator.ts`  | User extractor    | Mengambil user dari request untuk controller yang butuh identitas login. | `CurrentUser` `current-user.decorator.ts:15`                                     |
| `backend/src/common/guards/jwt-auth.guard.ts`              | Auth guard utama  | Memblokir endpoint private bila token tidak valid.                       | `JwtAuthGuard` `jwt-auth.guard.ts:18`                                            |
| `backend/src/common/guards/optional-jwt-auth.guard.ts`     | Auth opsional     | Mengisi `req.user` bila token valid tanpa memblokir user anonim.         | `OptionalJwtAuthGuard` `optional-jwt-auth.guard.ts:12`                           |
| `backend/src/common/guards/roles.guard.ts`                 | Role guard        | Memastikan user punya role yang cocok dengan metadata endpoint.          | `RolesGuard` `roles.guard.ts:18`                                                 |
| `backend/src/common/filters/http-exception.filter.ts`      | Error formatter   | Mengubah exception menjadi response error yang konsisten.                | `HttpExceptionFilter` `http-exception.filter.ts:13`                              |
| `backend/src/common/interceptors/transform.interceptor.ts` | Response wrapper  | Membungkus response sukses dalam format standar.                         | `TransformInterceptor` `transform.interceptor.ts:19`                             |
| `backend/src/common/utils/slug.util.ts`                    | Helper slug       | Membuat slug destinasi yang stabil dan unik.                             | `generateSlug` `slug.util.ts:2`, `generateUniqueSlug` `slug.util.ts:13`          |
| `backend/src/common/utils/pagination.util.ts`              | Helper pagination | Menghitung offset, total page, dan order query.                          | `calculateOffset` `pagination.util.ts:4`, `buildOrderBy` `pagination.util.ts:14` |

### Auth, User, Profile

| Path                                                  | Posisi pada flow    | Kegunaan                                                                                                              | Referensi baris utama                                                                                     |
| ----------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `backend/src/modules/auth/auth.controller.ts`         | Endpoint auth       | Menangani register, login password, login Google, refresh token, dan logout.                                          | `AuthController` `auth.controller.ts:10`                                                                  |
| `backend/src/modules/auth/auth.service.ts`            | Logic auth          | Validasi password, verifikasi Google ID token, auto-link akun Google, generate JWT, refresh token, dan response user. | `AuthService` `auth.service.ts:16`                                                                        |
| `backend/src/modules/auth/strategies/jwt.strategy.ts` | JWT strategy        | Membaca payload token dan memasukkan user ke request.                                                                 | `JwtStrategy` `jwt.strategy.ts:9`                                                                         |
| `backend/src/modules/auth/dto/*.ts`                   | Validasi input auth | Menjaga bentuk request login/register/Google/refresh sebelum masuk service.                                           | `LoginDto` `login.dto.ts:5`, `RegisterDto` `register.dto.ts:11`, `GoogleLoginDto` `google-login.dto.ts:4` |
| `backend/src/modules/users/users.controller.ts`       | Endpoint user       | Menyediakan profile, update profile, upload avatar, dan data user login.                                              | `UsersController` `users.controller.ts:27`                                                                |
| `backend/src/modules/users/users.service.ts`          | Logic user          | Mengambil, memperbarui, dan memformat data user.                                                                      | `UsersService` `users.service.ts:15`                                                                      |
| `backend/src/modules/admin/admin-users.controller.ts` | Admin user          | CRUD dan manajemen user dari dashboard admin.                                                                         | `AdminUsersController` `admin-users.controller.ts:30`                                                     |

### Destinasi, Search, Compare, dan Tampilan User

| Path                                                                | Posisi pada flow       | Kegunaan                                                                                       | Referensi baris utama                                                                                      |
| ------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `backend/src/modules/destinations/destinations.controller.ts`       | Public destination API | Endpoint list/detail destinasi yang dipakai halaman search, home, detail, compare, dan mobile. | `DestinationsController` `destinations.controller.ts:11`                                                   |
| `backend/src/modules/destinations/destinations.service.ts`          | Facade destinasi       | Menjaga method controller tetap kompatibel dan meneruskan ke provider admin/catalog/detail.    | `DestinationsService`                                                                                      |
| `backend/src/modules/destinations/destination-*.service.ts`         | Provider destinasi     | Memisahkan CRUD/media admin, katalog/rekomendasi, dan detail/agregasi.                         | `DestinationAdminService`, `DestinationCatalogService`, `DestinationDetailService`                         |
| `backend/src/modules/destinations/admin-destinations.controller.ts` | Admin destination API  | CRUD destinasi, upload gambar, update maps, dan trigger scraping dari admin.                   | `AdminDestinationsController` `admin-destinations.controller.ts:57`                                        |
| `backend/src/modules/destinations/destination-categories.ts`        | Kategori tetap         | Menjadi sumber nilai kategori yang dipakai DTO, frontend, dan constraint database.             | `DESTINATION_CATEGORIES` `destination-categories.ts:1`                                                     |
| `backend/src/modules/destinations/dto/*.ts`                         | DTO destinasi          | Validasi input list, create, update, maps URL, dan response shape.                             | `CreateDestinationDto` `create-destination.dto.ts:14`, `DestinationQueryDto` `destination-query.dto.ts:11` |
| `backend/src/modules/search/search.controller.ts`                   | Endpoint search        | Menerima keyword/semantic search dari web/mobile dan menyimpan history jika user login.        | `SearchController` `search.controller.ts:43`                                                               |
| `backend/src/modules/search/search.service.ts`                      | Logic search           | Menggabungkan keyword, semantic embedding, filter kota/kategori/rating/sentimen, dan ranking.  | `SearchService` `search.service.ts:16`                                                                     |
| `backend/src/modules/search/dto/search-query.dto.ts`                | Validasi search        | Menormalisasi query, category, topic ids, min rating, dan opsi mode search.                    | `SearchQueryDto` `search-query.dto.ts:37`                                                                  |
| `backend/src/modules/vector/vector.service.ts`                      | Pgvector query         | Menjalankan pencarian vector dan rata-rata embedding destinasi.                                | `VectorService` `vector.service.ts:16`                                                                     |
| `backend/src/modules/analytics/analytics.controller.ts`             | Public analytics       | Menyediakan data analytics untuk compare dan insight user.                                     | `AnalyticsController` `analytics.controller.ts:16`                                                         |
| `backend/src/modules/analytics/analytics.service.ts`                | Facade analytics       | Menjaga method controller dan mendelegasikan dashboard/detail/compare/export/recalculation.    | `AnalyticsService`                                                                                         |
| `backend/src/modules/analytics/*-analytics.service.ts`              | Provider analytics     | Query dan transformasi analytics sesuai domain tampilan.                                       | Dashboard, destination, comparison                                                                         |

### NLP, Topic, Scraper, Review, Favorite

| Path                                                      | Posisi pada flow       | Kegunaan                                                                                           | Referensi baris utama                                                                                  |
| --------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `backend/src/modules/nlp/nlp.controller.ts`               | Admin NLP endpoint     | Menerima preflight/upload/history HTTP request lalu mendelegasikan workflow ke service.            | `NlpController` `nlp.controller.ts:33`                                                                 |
| `backend/src/modules/nlp/nlp-upload.service.ts`           | Facade NLP upload      | Menjaga API controller dan mendelegasikan preparation, history, pipeline, serta execution.         | `NlpUploadService`                                                                                     |
| `backend/src/modules/nlp/nlp-upload-*.service.ts`         | Provider NLP upload    | Parsing/preflight, eksekusi mode, call model, rollback, dan history run.                           | Preparation, execution, pipeline runner, processing history                                            |
| `backend/src/modules/nlp/nlp-review-dedup.service.ts`     | Dedup review NLP       | Menentukan review baru/duplikat/proses ulang dan membuat/recover review berdasarkan `review_hash`. | `NlpReviewDedupService`                                                                                |
| `backend/src/modules/nlp/nlp.service.ts`                  | HTTP client Model      | Mengirim file/text ke Python FastAPI dan menangani error service NLP.                              | `NlpService` `nlp.service.ts:13`                                                                       |
| `backend/src/modules/nlp/nlp-result-storage.service.ts`   | Facade storage NLP     | Mengatur urutan penyimpanan topic, review/embedding, lalu analytics destinasi.                     | `NlpResultStorageService`                                                                              |
| `backend/src/modules/nlp/ai-naming.service.ts`            | Client AI topic naming | Mengatur model Gemini, retry, throttle, quota, dan fallback chain.                                 | `AiNamingService`                                                                                      |
| `backend/src/modules/nlp/topic-name-policy.service.ts`    | Aturan nama topik      | Menyusun prompt serta memvalidasi/sanitasi label topik.                                            | `TopicNamePolicyService`                                                                               |
| `backend/src/modules/nlp/utils/nlp-dedup.util.ts`         | Helper dedup NLP       | Membuat hash file/review dan menormalisasi mode proses NLP.                                        | `createFileHash`, `createReviewHash`                                                                   |
| `backend/src/modules/nlp/utils/nlp-result.util.ts`        | Helper NLP result      | Menormalisasi label sentiment dan rata-rata embedding.                                             | `mapPipelineSentiment` `nlp-result.util.ts:2`, `averageAndNormalizeEmbeddings` `nlp-result.util.ts:13` |
| `backend/src/modules/topics/topics.controller.ts`         | Topic API              | Endpoint topic public/admin untuk search, detail, rename, group, dan visibility.                   | `TopicsController` `topics.controller.ts:23`                                                           |
| `backend/src/modules/topics/topics.service.ts`            | Facade topic           | Menjaga method controller dan meneruskan query/review/merge/group/management.                      | `TopicsService`                                                                                        |
| `backend/src/modules/topics/topic-*.service.ts`           | Provider topic         | Memisahkan query, review, merge, group, dan perubahan taxonomy.                                    | Provider topic sesuai nama file                                                                        |
| `backend/src/modules/scraper/scraper.controller.ts`       | Admin scraper API      | Endpoint job scraping, history, status, dan export.                                                | `ScraperController` `scraper.controller.ts:16`                                                         |
| `backend/src/modules/scraper/scraper.service.ts`          | Logic scraper          | Mengatur job scraping Google Maps, menyimpan hasil, dan membuat queue NLP.                         | `ScraperService` `scraper.service.ts:17`                                                               |
| `backend/src/modules/scraper/scraper.processor.ts`        | Worker scraping        | Memproses job queue scraping di background.                                                        | `ScraperProcessor` `scraper.processor.ts:38`                                                           |
| `backend/src/modules/scraper/scraper-workbook.service.ts` | Export Excel scraper   | Mapping kolom, styling, nama file, dan penyimpanan workbook.                                       | `ScraperWorkbookService`                                                                               |
| `backend/src/modules/scraper/nlp-process.processor.ts`    | Worker NLP queue       | Memproses queue NLP setelah scraping/upload.                                                       | `NlpProcessProcessor` `nlp-process.processor.ts:10`                                                    |
| `backend/src/modules/reviews/user-reviews.controller.ts`  | Review user API        | Menerima ulasan user aplikasi RanahInsight.                                                        | `UserReviewsController` `user-reviews.controller.ts:15`                                                |
| `backend/src/modules/reviews/admin-reviews.controller.ts` | Review admin API       | Filter, moderation, delete, dan analytics review untuk dashboard admin.                            | `AdminReviewsController` `admin-reviews.controller.ts:25`                                              |
| `backend/src/modules/reviews/reviews.service.ts`          | Logic review           | Menyimpan dan mengambil review user/scrape sesuai kebutuhan endpoint.                              | `ReviewsService` `reviews.service.ts:7`                                                                |
| `backend/src/modules/favorites/favorites.controller.ts`   | Favorite API           | Add/remove/check/list favorite untuk user web dan mobile.                                          | `FavoritesController` `favorites.controller.ts:25`                                                     |
| `backend/src/modules/favorites/favorites.service.ts`      | Logic favorite         | Menghubungkan user dengan destinasi favorit dan data card favorit.                                 | `FavoritesService` `favorites.service.ts:5`                                                            |
| `backend/src/modules/routes/routes.controller.ts`         | Route user/public API  | Katalog route, detail share, route user, save, duplicate, progress rute tersimpan, dan auto-sort.  | `RoutesController`                                                                                     |
| `backend/src/modules/routes/admin-routes.controller.ts`   | Admin route API        | CRUD curated route dan publish/unpublish route.                                                    | `AdminRoutesController`                                                                                |
| `backend/src/modules/routes/routes.service.ts`            | Facade route           | Menjaga method controller dan meneruskan query/access/progress/planning/management.                | `RoutesService`                                                                                        |
| `backend/src/modules/routes/route-*.service.ts`           | Provider route         | Ownership, query, perencanaan jarak, mutasi route, dan progress simpanan.                          | Provider route sesuai nama file                                                                        |

## Flow File ke Fungsi Backend

1. **Request masuk**: `main.ts:12` memasang global pipe/guard/filter, lalu request diarahkan ke controller domain, misalnya `search.controller.ts:43` atau `destinations.controller.ts:11`.
2. **Validasi input**: DTO seperti `search-query.dto.ts:37` dan `create-destination.dto.ts:14` membersihkan data sebelum service dijalankan.
3. **Business logic**: service domain seperti `DestinationsService` `destinations.service.ts:32`, `SearchService` `search.service.ts:16`, dan `AnalyticsService` `analytics.service.ts:9` menyiapkan query database dan response.
4. **Database**: semua service memakai `PrismaService` `prisma.service.ts:8`; query vector tetap dipusatkan di `VectorService` `vector.service.ts:16`.
5. **NLP**: `NlpController` `nlp.controller.ts:33` memanggil `NlpService` `nlp.service.ts:13`, lalu hasil Python disimpan oleh `NlpResultStorageService` `nlp-result-storage.service.ts:13`.
6. **Response ke frontend**: `TransformInterceptor` `transform.interceptor.ts:19` membungkus hasil sukses, sedangkan `HttpExceptionFilter` `http-exception.filter.ts:13` merapikan error.

# Pembaruan Konsistensi NLP Upload (Juni 2026)

- `POST /api/admin/nlp/upload` sekarang melakukan dedup dalam satu file upload dan terhadap data yang sudah ada di database.
- `POST /api/admin/nlp/preflight` menghitung duplikat dari dua sumber: review yang sudah ada di database dan baris duplikat dalam file yang sama.
- Hash review yang sudah dibuat pada request yang sama langsung dicatat sebagai known hash, sehingga baris duplikat dalam file tidak lagi memicu unique constraint `(destination_id, source, review_hash)`.
- Jika unique constraint tetap terjadi karena kondisi race atau data existing, `NlpReviewDedupService` mencoba mengambil review existing. Mode `reprocess_existing` dapat memakai review existing tersebut, sedangkan mode lain melewatinya sebagai duplikat.
- Rollback hanya menghapus review yang benar-benar dibuat pada request berjalan, bukan review existing yang ditemukan ulang.
