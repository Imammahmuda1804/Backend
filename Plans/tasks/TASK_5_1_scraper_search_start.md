# Task 5.1 — Scraper: Search Google Maps & Start Scraping

> **Phase:** 5 - Scraper
> **Status:** ⬜ Belum Dimulai
> **Estimasi:** 3-4 jam
> **Dependencies:** Task 4.1

---

## Objective

Implementasi search Google Maps via Apify API dan trigger scraping reviews.

---

## Endpoints

### GET /admin/scraper/search

Cari tempat wisata di Google Maps.

Query: `?q=jam gadang`

Response (200):

```json
{
  "status": "success",
  "data": [
    {
      "title": "Jam Gadang",
      "address": "Bukittinggi, Sumatera Barat",
      "rating": 4.6,
      "totalReviews": 15000,
      "placeId": "ChIJ...",
      "url": "https://maps.google.com/..."
    }
  ]
}
```

Logic:
1. Call Apify Google Maps Search actor
2. Parse response
3. Return formatted results

---

### POST /admin/scraper/start

Trigger scraping reviews dari Google Maps.

Request:

```json
{
  "destination_id": 1,
  "max_reviews": 1000,
  "sort": "newest",
  "stars_filter": [5, 4],
  "has_text": true
}
```

Response (202):

```json
{
  "status": "success",
  "data": {
    "job_id": 1,
    "status": "pending",
    "message": "Scraping job started"
  }
}
```

Logic:
1. Validate destination exists
2. Create ScrapingJob record (status: "pending")
3. Dispatch BullMQ job untuk scraping async
4. Return job ID segera (non-blocking)

BullMQ Job Logic:
1. Update job status → "running"
2. Get google_maps_url dari destination
3. Call Apify Google Maps Reviews actor
4. Polling Apify run status
5. Fetch results
6. Save raw reviews ke database
7. Update ScrapingJob (status: "completed", total_reviews)
8. Create ScrapingHistory record

---

## Steps

### 1. Buat Scraper Module

```bash
nest g module modules/scraper
nest g controller modules/scraper
nest g service modules/scraper
```

### 2. Setup Apify Service

Buat `src/modules/scraper/apify.service.ts`:

- `searchPlaces()` — call Apify search actor
- `startReviewScraping()` — call Apify reviews actor
- `getRunStatus()` — check Apify run status
- `getRunResults()` — fetch Apify run results

### 3. Setup BullMQ Queue

Buat `src/modules/scraper/scraper.queue.ts`:

- Register queue: `scraping-queue`
- Buat processor: `ScrapingProcessor`

### 4. Buat DTOs

- `search-query.dto.ts`
- `start-scraping.dto.ts`

### 5. Implementasi Scraper Controller

- `@Get('search')` — `@Roles('ADMIN')`
- `@Post('start')` — `@Roles('ADMIN')`

---

## Files yang Dibuat

```text
src/modules/scraper/
├── scraper.module.ts         (new)
├── scraper.controller.ts     (new)
├── scraper.service.ts        (new)
├── apify.service.ts          (new)
├── scraper.processor.ts      (new — BullMQ processor)
├── dto/
│   ├── search-query.dto.ts   (new)
│   └── start-scraping.dto.ts (new)
```

---

## Acceptance Criteria

- [ ] GET /search mengembalikan hasil pencarian Google Maps
- [ ] GET /search menolak query kosong (400)
- [ ] POST /start membuat ScrapingJob dengan status "pending"
- [ ] POST /start dispatch BullMQ job (async)
- [ ] POST /start return 202 segera (non-blocking)
- [ ] BullMQ processor berhasil scrape reviews via Apify
- [ ] Raw reviews tersimpan di tabel reviews
- [ ] ScrapingJob status terupdate (pending → running → completed/failed)
- [ ] ScrapingHistory record terbuat setelah selesai
- [ ] Hanya ADMIN yang bisa mengakses
