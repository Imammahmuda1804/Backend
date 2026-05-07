# Task 6.3 — Upload Reviews & NLP Pipeline

> **Phase:** 6 - NLP & Vector
> **Status:** ⬜ Belum Dimulai
> **Estimasi:** 3-4 jam
> **Dependencies:** Task 6.1, Task 6.2, Task 5.3

---

## Objective

Implementasi endpoint upload CSV/Excel sebagai sumber data alternatif untuk analisis, dan integrasi penuh NLP pipeline result storage.

---

## Endpoints

### POST /admin/destinations/:id/upload-reviews

Upload file review untuk destinasi tertentu → langsung trigger NLP pipeline.

Request: `multipart/form-data` dengan field `file`

Response (202):

```json
{
  "status": "success",
  "data": {
    "message": "File uploaded and NLP processing started",
    "job_id": 1,
    "total_rows": 500
  }
}
```

Logic:
1. Validate file format (csv/xlsx/xls)
2. Validate file size (max 10MB)
3. Parse file → extract reviews
4. Validate row count (max 50.000)
5. Create ScrapingJob (source: "upload")
6. Save raw reviews ke database
7. Dispatch BullMQ job untuk NLP processing
8. Return job ID

---

## NLP Pipeline Result Storage (Shared Logic)

Setelah FastAPI mengembalikan NLP results, simpan ke database:

### Step 1: Save/Update Topics

```typescript
for (const topic of nlpResult.topics) {
  await prisma.topic.upsert({
    where: { id: topic.id },
    create: { topicName: topic.name, keywords: topic.keywords },
    update: { topicName: topic.name, keywords: topic.keywords },
  });
}
```

### Step 2: Update Reviews

```typescript
for (const review of nlpResult.reviews) {
  await prisma.review.update({
    where: { id: reviewIds[review.index] },
    data: {
      cleanedText: review.cleaned_text,
      sentiment: review.sentiment,
      topicId: review.topic_id,
    },
  });
}
```

### Step 3: Save Review Embeddings

```typescript
await vectorService.batchInsertReviewEmbeddings(
  nlpResult.reviews.map(r => ({
    reviewId: reviewIds[r.index],
    embedding: r.embedding,
  })),
);
```

### Step 4: Update Destination Embedding

```typescript
await vectorService.upsertDestinationEmbedding(
  destinationId,
  nlpResult.destination_embedding,
);
```

### Step 5: Update Destination Analytics

```typescript
const totalReviews = reviews.length;
const positiveCount = reviews.filter(r => r.sentiment === 'positive').length;
const positiveRatio = positiveCount / totalReviews;

await prisma.destination.update({
  where: { id: destinationId },
  data: {
    positiveRatio,
    recommendationScore: calculateRecommendationScore(positiveRatio, userRating),
  },
});
```

### Step 6: Update Sentiment Trends

Group reviews by date, update sentiment_trends table.

### Step 7: Update Destination Topics

Aggregate topic counts per destination.

---

## Steps

### 1. Buat Upload Module

```bash
nest g module modules/uploads
nest g controller modules/uploads
nest g service modules/uploads
```

### 2. Buat File Parser Service

- `parseCSV()` — parse CSV file
- `parseExcel()` — parse XLSX/XLS file
- `validateRows()` — validate row count dan required columns

### 3. Buat NLP Result Storage Service

Shared service yang dipakai oleh scraper process DAN upload process:

- `saveNlpResults()` — orchestrate semua step di atas
- `updateSentimentTrends()`
- `updateDestinationTopics()`
- `calculateRecommendationScore()`

### 4. Implementasi Upload Controller

- `@Post('destinations/:id/upload-reviews')` — `@Roles('ADMIN')`
- `@UseInterceptors(FileInterceptor('file'))`

---

## Files yang Dibuat

```text
src/modules/uploads/
├── uploads.module.ts          (new)
├── uploads.controller.ts      (new)
├── uploads.service.ts         (new)
├── file-parser.service.ts     (new)

src/modules/nlp/
├── nlp-result-storage.service.ts  (new — shared storage logic)
```

---

## Acceptance Criteria

- [ ] Upload CSV berhasil dan trigger NLP pipeline
- [ ] Upload XLSX/XLS berhasil dan trigger NLP pipeline
- [ ] Menolak file format selain csv/xlsx/xls (400)
- [ ] Menolak file > 10MB (400)
- [ ] Menolak file > 50.000 rows (400)
- [ ] NLP results tersimpan: sentiment, topics, embeddings
- [ ] Destination analytics terupdate (positive_ratio, recommendation_score)
- [ ] Sentiment trends terupdate
- [ ] Destination topics terupdate
- [ ] ScrapingJob terbuat dengan source "upload"
- [ ] Hanya ADMIN yang bisa mengakses
