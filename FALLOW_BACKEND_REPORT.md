# Fallow Backend Static Analysis Report

Tanggal audit final: 2026-06-09

## Hasil Final

Audit dijalankan dari folder `backend` setelah refactor tanpa mengubah endpoint,
DTO, Prisma schema, atau response API.

| Pemeriksaan                       | Hasil       |
| --------------------------------- | ----------- |
| Fallow health findings            | `0`         |
| Dead-code issues                  | `0`         |
| Clone groups                      | `0`         |
| Duplicated lines                  | `0`         |
| Circular dependencies             | `0`         |
| Unresolved imports                | `0`         |
| Health grade                      | `A`         |
| Health score                      | `87.2`      |
| File TypeScript di atas 500 baris | `0`         |
| TypeScript `tsc --noEmit`         | Lulus       |
| ESLint seluruh backend            | Lulus       |
| Nest production build             | Lulus       |
| Unit test                         | `1/1` lulus |
| E2E test                          | `1/1` lulus |

JSON audit final:

- `fallow-final-dead-code.json`
- `fallow-final-dupes.json`
- `fallow-final-health.json`
- `fallow-final-combined.json`

## Perubahan Struktur

Service besar diubah menjadi facade tipis dan provider sesuai tanggung jawab:

- Analytics dipisahkan menjadi dashboard, detail destinasi, compare/insight,
  export, dan recalculation.
- Destination dipisahkan menjadi admin, katalog, dan detail.
- Topic dipisahkan menjadi query, review, merge, group, dan management.
- Route dipisahkan menjadi access, query, planning, management, dan saved-route
  progress.
- NLP upload dipisahkan menjadi preparation, processing history, pipeline
  runner, execution, dan dedup.
- Penyimpanan NLP dipisahkan menjadi topic, review/embedding, dan analytics
  destinasi.
- AI naming dipisahkan antara komunikasi Gemini, aturan nama topik, dan
  classifier topic group.
- Scraper queue dipisahkan dari pembuatan/styling workbook Excel.

Facade dengan nama lama tetap dipakai controller. Karena itu kontrak API untuk
web dan mobile tidak berubah.

## Cara Membaca Backend

Untuk pembaca yang belum terbiasa NestJS:

1. Cari endpoint pada file `*.controller.ts`.
2. Lihat facade service yang dipanggil controller.
3. Ikuti provider berdasarkan nama pekerjaannya.
4. DTO menjelaskan bentuk input.
5. `PrismaService` adalah pintu query database.
6. Module menjelaskan provider yang tersedia melalui dependency injection.

Contoh flow route:

```text
RoutesController
  -> RoutesService (facade)
     -> RouteQueryService
     -> RouteAccessService
     -> RouteManagementService
     -> RoutePlanningService
     -> SavedRouteProgressService
```

Contoh flow upload NLP:

```text
NlpController
  -> NlpUploadService (facade)
     -> NlpUploadPreparationService
     -> NlpProcessingHistoryService
     -> NlpUploadExecutionService
        -> NlpReviewDedupService
        -> NlpPipelineRunnerService
        -> NlpResultStorageService
```

## Catatan Tentang Hotspot

Fallow masih menampilkan daftar `hotspots` berbasis frekuensi perubahan Git.
Nilai tersebut adalah sinyal riwayat perubahan, bukan finding source code yang
masih gagal. File facade lama tetap dapat muncul karena pernah sering berubah,
meskipun implementasinya sekarang sudah kecil.

Finding yang dapat diperbaiki dari source code sudah `0`. Skor `87.2` tetap
mendapat penalti hotspot riwayat Git dan profil ukuran statistik, bukan karena
dead code, duplikasi, circular dependency, unresolved import, atau fungsi yang
melewati threshold.

## Verifikasi Kandidat Security

`fallow security` bersifat candidate scanner, bukan bukti kerentanan. Kandidat
yang tersisa telah diperiksa:

- File destinasi memakai `path.basename(filename)` sebelum masuk folder upload.
- Download scraper hanya menerima `jobId` positive safe integer dan membentuk
  nama `job_<id>.xlsx`.
- Nama workbook dibersihkan menjadi alfanumerik/underscore dan memiliki
  fallback `Destination`.
- Header download memakai `encodeURIComponent` dan format `filename*=UTF-8''`.
- Path `sync-topics.ts` dibentuk dari konstanta source code, bukan request user.

Dynamic regular expression pada parser tanggal telah dihapus. Kandidat path dan
header yang masih muncul adalah sink konservatif dengan input yang sudah
dibatasi seperti di atas; tidak ada suppression Fallow yang ditambahkan.

## Perintah Verifikasi

```powershell
npx tsc --noEmit
npm run lint -- --quiet
npm run build
npm test -- --runInBand
npx fallow dead-code --format json --quiet
npx fallow dupes --format json --quiet
npx fallow health --format json --quiet
npx fallow --format json --quiet --score
npx fallow security --format json --quiet
```
