# Task 5.3 — Scraper: Download CSV & Process (Trigger NLP)

> **Phase:** 5 - Scraper
> **Status:** ⬜ Belum Dimulai
> **Estimasi:** 3-4 jam
> **Dependencies:** Task 5.1, Task 5.2

---

## Objective

Implementasi download CSV hasil scraping dan trigger NLP processing pipeline.

---

## Endpoints

### GET /admin/scraper/download/:jobId

Download hasil scraping sebagai file CSV.

Response: File CSV download

Headers:
```text
Content-Type: text/csv
Content-Disposition: attachment; filename="reviews_job_1.csv"
```

Logic:
1. Find ScrapingJob by ID (validate completed)
2. Query reviews berdasarkan job
3. Generate CSV dari reviews
4. Stream file ke client

---

### POST /admin/scraper/process/:jobId

Trigger NLP pipeline processing.

Response (202):

```json
{
  "status": "success",
  "data": {
    "message": "NLP processing started",
    "job_id": 1
  }
}
```

Logic:
1. Find ScrapingJob by ID (validate completed)
2. Query reviews dari job
3. Generate internal CSV file
4. Dispatch BullMQ job untuk NLP processing
5. BullMQ job:
   a. POST CSV ke FastAPI `/pipeline/process`
   b. Receive NLP results
   c. Update reviews (sentiment, topic_id, cleaned_text)
   d. Save embeddings ke review_embeddings
   e. Update destination analytics (positive_ratio, recommendation_score)
   f. Update sentiment_trends
   g. Update destination_topics

---

### POST /admin/destinations/:id/scrape

Shortcut scraping berdasarkan destination.

Request:

```json
{
  "max_reviews": 1000,
  "sort": "newest",
  "stars_filter": [5, 4],
  "has_text": true
}
```

Logic:
1. Ambil google_maps_url dari destination
2. Trigger scraper (reuse POST /admin/scraper/start logic)
3. Create scraping job

---

## Steps

### 1. Implementasi CSV Generation

Buat `src/modules/scraper/csv.service.ts`:

- `generateCsv()` — generate CSV dari reviews
- `generateInternalCsv()` — format CSV untuk FastAPI

### 2. Implementasi NLP Processing Queue

Buat/update `src/modules/scraper/nlp-process.processor.ts`:

- BullMQ processor untuk NLP pipeline
- POST ke FastAPI
- Parse response
- Save results ke database

### 3. Tambah di Scraper Controller

- `@Get('download/:jobId')` — file download
- `@Post('process/:jobId')` — trigger NLP

### 4. Tambah di Admin Destinations Controller

- `@Post(':id/scrape')` — shortcut scraping

---

## Files yang Dimodifikasi/Dibuat

```text
src/modules/scraper/
├── scraper.controller.ts        (modified — tambah download, process)
├── scraper.service.ts           (modified — tambah downloadCsv, processNlp)
├── csv.service.ts               (new)
├── nlp-process.processor.ts     (new — BullMQ processor)

src/modules/destinations/
├── admin-destinations.controller.ts (modified — tambah shortcut scrape)
```

---

## Acceptance Criteria

- [ ] GET /download/:jobId mendownload file CSV
- [ ] GET /download/:jobId return 404 untuk job tidak ditemukan
- [ ] GET /download/:jobId return 400 untuk job belum selesai
- [ ] POST /process/:jobId trigger NLP processing async
- [ ] POST /process/:jobId return 202 (non-blocking)
- [ ] NLP processor berhasil mengirim CSV ke FastAPI
- [ ] NLP results tersimpan di database (sentiment, topics, embeddings)
- [ ] Destination analytics terupdate setelah NLP selesai
- [ ] POST /destinations/:id/scrape berhasil trigger scraping
- [ ] Hanya ADMIN yang bisa mengakses
