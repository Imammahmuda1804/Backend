# Task 5.2 — Scraper: Status Polling, Jobs, History

> **Phase:** 5 - Scraper
> **Status:** ⬜ Belum Dimulai
> **Estimasi:** 2-3 jam
> **Dependencies:** Task 5.1

---

## Objective

Implementasi endpoint untuk monitoring scraping: status polling, list jobs, dan history.

---

## Endpoints

### GET /admin/scraper/status/:jobId

Polling scraping progress.

Response (200):

```json
{
  "status": "success",
  "data": {
    "job_id": 1,
    "status": "running",
    "total_reviews": 450,
    "started_at": "2026-01-01T10:00:00Z",
    "finished_at": null,
    "error_message": null
  }
}
```

Logic:
1. Find ScrapingJob by ID
2. Return current status

---

### GET /admin/scraper/jobs

List semua scraping jobs.

Query: `?page=1&limit=10&status=completed`

Response: paginated list of ScrapingJob with destination name.

---

### GET /admin/scraper/history

Riwayat scraping per destination.

Query: `?page=1&limit=10&destination_id=1`

Response: paginated list of ScrapingHistory with job details.

---

## Steps

### 1. Implementasi di Scraper Service

- `getJobStatus()` — find job by ID
- `getAllJobs()` — paginated list with filters
- `getHistory()` — paginated history with relations

### 2. Tambah di Scraper Controller

- `@Get('status/:jobId')` — polling endpoint
- `@Get('jobs')` — list jobs
- `@Get('history')` — scraping history

### 3. Buat DTOs

- `job-query.dto.ts`
- `history-query.dto.ts`

---

## Files yang Dimodifikasi/Dibuat

```text
src/modules/scraper/
├── scraper.controller.ts     (modified — tambah 3 endpoints)
├── scraper.service.ts        (modified — tambah getJobStatus, getAllJobs, getHistory)
├── dto/
│   ├── job-query.dto.ts      (new)
│   └── history-query.dto.ts  (new)
```

---

## Acceptance Criteria

- [ ] GET /status/:jobId mengembalikan status scraping job terkini
- [ ] GET /status/:jobId return 404 untuk job tidak ditemukan
- [ ] GET /jobs mengembalikan paginated list of jobs
- [ ] GET /jobs mendukung filter by status
- [ ] GET /history mengembalikan paginated scraping history
- [ ] GET /history mendukung filter by destination_id
- [ ] Hanya ADMIN yang bisa mengakses
