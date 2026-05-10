# Data Storage Flow - Scraping & NLP Analysis

## 📊 Alur Lengkap Penyimpanan Data

### 🔄 FASE 1: SCRAPING JOB (Upload CSV)

#### 1.1 Upload File CSV
**Endpoint**: `POST /api/uploads/reviews`
**File**: `src/modules/uploads/uploads.controller.ts` → `uploads.service.ts`

```
User Upload CSV
    ↓
Parse CSV (file-parser.service.ts)
    ↓
Validasi kolom & data
    ↓
SIMPAN KE DATABASE
```

#### 1.2 Data yang Disimpan ke Database

**Tabel: `ScrapingJob`**
```sql
INSERT INTO "ScrapingJob" (
  "destinationId",
  "status",           -- 'pending'
  "totalReviews",     -- jumlah rows di CSV
  "createdAt"
)
```
**Lokasi Code**: `src/modules/uploads/uploads.service.ts` (method: `processUpload`)

**Tabel: `Review`**
```sql
INSERT INTO "Review" (
  "destinationId",
  "scrapingJobId",    -- FK ke ScrapingJob
  "reviewText",       -- dari kolom "Teks Ulasan"
  "reviewerName",     -- dari kolom "Nama Pengulas"
  "rating",           -- dari kolom "Rating"
  "reviewDate",       -- dari kolom "Tanggal Ulasan"
  "likesCount",       -- dari kolom "Jumlah Suka"
  "source",           -- 'csv_upload'
  "createdAt"
)
```
**Lokasi Code**: `src/modules/uploads/uploads.service.ts` (method: `processUpload`)

**Contoh Data Tersimpan**:
```javascript
// ScrapingJob
{
  id: 16,
  destinationId: 1,
  status: 'pending',
  totalReviews: 15,
  createdAt: '2026-05-08T11:13:54.000Z'
}

// Review (15 rows)
{
  id: 204,
  destinationId: 1,
  scrapingJobId: 16,
  reviewText: 'Tempat yang sangat indah dan menyenangkan...',
  reviewerName: 'Budi Santoso',
  rating: 5,
  reviewDate: '2024-03-15',
  likesCount: 10,
  source: 'csv_upload',
  // Field NLP (masih NULL)
  cleanedText: null,
  sentiment: null,
  topicId: null
}
```

#### 1.3 Queue NLP Processing Job
**Lokasi**: `src/modules/uploads/uploads.service.ts`

```typescript
// Setelah data tersimpan, queue job untuk NLP processing
await this.scraperQueue.add('nlp-process', {
  jobId: scrapingJob.id,
  destinationId: destinationId,
});
```

**Queue**: BullMQ (Redis)
- Queue Name: `nlp-queue`
- Job Type: `nlp-process`
- Data: `{ jobId, destinationId }`

---

### 🤖 FASE 2: NLP PROCESSING

#### 2.1 Worker Mengambil Job
**File**: `src/modules/scraper/nlp-process.processor.ts`
**Class**: `NlpProcessProcessor`

```typescript
async process(job: Job<{ jobId, destinationId }>) {
  // 1. Ambil reviews dari database
  const reviews = await prisma.review.findMany({
    where: { scrapingJobId: jobId }
  });
  
  // 2. Format ke CSV untuk FastAPI
  const nlpData = reviews.map((r, index) => ({
    index,
    'Teks Ulasan': r.reviewText,
    'Nama Pengulas': r.reviewerName,
    'Rating': r.rating,
    'Tanggal Ulasan': r.reviewDate,
    'Jumlah Suka': r.likesCount,
  }));
  
  // 3. Kirim ke FastAPI
  const nlpResult = await nlpService.processPipeline(csvBuffer, filename);
  
  // 4. Simpan hasil ke database
  await nlpStorageService.saveNlpResults(destinationId, nlpResult, reviewIds);
}
```

#### 2.2 Kirim ke FastAPI
**Endpoint FastAPI**: `POST http://localhost:8001/pipeline/process`
**Content-Type**: `multipart/form-data`
**Key**: `file`

**Request**:
```csv
index,Teks Ulasan,Nama Pengulas,Rating,Tanggal Ulasan,Jumlah Suka
0,"Tempat yang sangat indah...","Budi Santoso",5,"2024-03-15",10
1,"Bagus tapi agak ramai...","Ani Wijaya",4,"2024-03-20",5
...
```

**Response dari FastAPI**:
```json
{
  "summary": {
    "total": 15,
    "positive": 12,
    "negative": 1,
    "neutral": 2
  },
  "results": [
    {
      "text": "Tempat yang sangat indah...",
      "cleaned_text": "tempat yang sangat indah...",
      "sentiment": "positif",
      "topic_id": 23,
      "embedding": [0.123, -0.456, 0.789, ...]  // 384 dimensions
    },
    {
      "text": "Bagus tapi agak ramai...",
      "cleaned_text": "bagus tapi agak ramai...",
      "sentiment": "positif",
      "topic_id": 82,
      "embedding": [0.234, -0.567, 0.890, ...]
    }
    // ... 13 more
  ],
  "topics": [
    {
      "topic_id": 23,
      "keywords": ["indah", "beautiful", "place", "terindah", "desa"]
    },
    {
      "topic_id": 82,
      "keywords": ["weekend", "pekan", "akhir", "sabtu", "macet"]
    }
    // ... more topics
  ]
}
```

---

### 💾 FASE 3: SIMPAN HASIL ANALISIS NLP

**File**: `src/modules/nlp/nlp-result-storage.service.ts`
**Method**: `saveNlpResults(destinationId, nlpResult, reviewIds)`

#### 3.1 Simpan/Update Topics
**Tabel: `Topic`**

```sql
-- Untuk setiap topic dari FastAPI
INSERT INTO "Topic" (
  "id",              -- topic_id dari FastAPI (23, 82, dll)
  "topicName",       -- "Topic 23: indah, beautiful, place"
  "keywords"         -- ["indah", "beautiful", "place", "terindah", "desa"]
)
ON CONFLICT (id) DO UPDATE
SET 
  "topicName" = EXCLUDED."topicName",
  "keywords" = EXCLUDED."keywords"
```

**Lokasi Code**:
```typescript
// Line ~20-40 di nlp-result-storage.service.ts
for (const topic of nlpResult.topics) {
  const topicId = topic.topic_id;
  const topicName = `Topic ${topicId}: ${topic.keywords.slice(0, 3).join(', ')}`;
  
  await this.prisma.topic.upsert({
    where: { id: topicId },
    create: { id: topicId, topicName, keywords: topic.keywords },
    update: { topicName, keywords: topic.keywords }
  });
}
```

**Contoh Data Tersimpan**:
```javascript
// Topic table
[
  { id: 23, topicName: 'Topic 23: indah, beautiful, place', keywords: ['indah', 'beautiful', 'place', 'terindah', 'desa'] },
  { id: 82, topicName: 'Topic 82: weekend, pekan, akhir', keywords: ['weekend', 'pekan', 'akhir', 'sabtu', 'macet'] },
  { id: 40, topicName: 'Topic 40: nyaman, santai, tempatnya', keywords: ['nyaman', 'santai', 'tempatnya', 'suasana', 'tempat'] }
]
```

#### 3.2 Update Reviews dengan Hasil NLP
**Tabel: `Review`**

```sql
-- Untuk setiap review
UPDATE "Review"
SET
  "cleanedText" = ?,    -- dari FastAPI results[i].cleaned_text
  "sentiment" = ?,      -- 'positif' → 'positive' (di-mapping)
  "topicId" = ?         -- dari FastAPI results[i].topic_id
WHERE "id" = ?
```

**Lokasi Code**:
```typescript
// Line ~45-60 di nlp-result-storage.service.ts
const mapSentiment = (sentiment: string): string => {
  const sentimentMap = {
    'positif': 'positive',
    'negatif': 'negative',
    'netral': 'neutral',
  };
  return sentimentMap[sentiment.toLowerCase()] || sentiment;
};

for (let index = 0; index < nlpResult.results.length; index++) {
  const review = nlpResult.results[index];
  const realReviewId = reviewIds[index];
  const mappedSentiment = mapSentiment(review.sentiment);
  
  await this.prisma.review.update({
    where: { id: realReviewId },
    data: {
      cleanedText: review.cleaned_text,
      sentiment: mappedSentiment,
      topicId: review.topic_id,
    }
  });
}
```

**Contoh Data Tersimpan**:
```javascript
// Review table (AFTER NLP)
{
  id: 204,
  destinationId: 1,
  scrapingJobId: 16,
  reviewText: 'Tempat yang sangat indah dan menyenangkan...',
  reviewerName: 'Budi Santoso',
  rating: 5,
  reviewDate: '2024-03-15',
  likesCount: 10,
  source: 'csv_upload',
  // Field NLP (UPDATED)
  cleanedText: 'tempat yang sangat indah dan menyenangkan...',
  sentiment: 'positive',  // ← mapped dari 'positif'
  topicId: 23             // ← FK ke Topic
}
```

#### 3.3 Simpan Review Embeddings
**Tabel: `ReviewEmbedding`**

```sql
-- Batch insert untuk semua review embeddings
INSERT INTO "ReviewEmbedding" (
  "reviewId",
  "embedding"     -- vector(384) - array of floats
)
VALUES 
  (204, '[0.123, -0.456, 0.789, ...]'),
  (205, '[0.234, -0.567, 0.890, ...]'),
  ...
```

**Lokasi Code**:
```typescript
// Line ~65-75 di nlp-result-storage.service.ts
const embeddingsToInsert = nlpResult.results
  .filter((r) => r.embedding && r.embedding.length > 0)
  .map((r, index) => ({
    reviewId: reviewIds[index],
    embedding: r.embedding,
  }));

if (embeddingsToInsert.length > 0) {
  await this.vectorService.batchInsertReviewEmbeddings(embeddingsToInsert);
}
```

**File VectorService**: `src/modules/vector/vector.service.ts`

**Contoh Data Tersimpan**:
```javascript
// ReviewEmbedding table
{
  id: 1,
  reviewId: 204,
  embedding: [0.123, -0.456, 0.789, ..., 0.321]  // 384 floats
}
```

#### 3.4 Hitung & Simpan Destination Embedding
**Tabel: `DestinationEmbedding`** (jika ada di schema)

```sql
-- Average dari semua review embeddings
INSERT INTO "DestinationEmbedding" (
  "destinationId",
  "embedding"     -- vector(384) - rata-rata dari semua review embeddings
)
ON CONFLICT ("destinationId") DO UPDATE
SET "embedding" = EXCLUDED."embedding"
```

**Lokasi Code**:
```typescript
// Line ~78-100 di nlp-result-storage.service.ts
const validEmbeddings = nlpResult.results
  .filter((r) => r.embedding && r.embedding.length > 0)
  .map((r) => r.embedding);

if (validEmbeddings.length > 0) {
  const embeddingDim = validEmbeddings[0].length;
  const destinationEmbedding = new Array(embeddingDim).fill(0);

  // Calculate average
  for (const embedding of validEmbeddings) {
    for (let i = 0; i < embeddingDim; i++) {
      destinationEmbedding[i] += embedding[i];
    }
  }

  for (let i = 0; i < embeddingDim; i++) {
    destinationEmbedding[i] /= validEmbeddings.length;
  }

  await this.vectorService.upsertDestinationEmbedding(
    destinationId,
    destinationEmbedding,
  );
}
```

#### 3.5 Update Destination Analytics
**Tabel: `Destination`**

```sql
UPDATE "Destination"
SET
  "positiveRatio" = ?,        -- positive_count / total_reviews
  "recommendationScore" = ?   -- weighted score (rating + sentiment)
WHERE "id" = ?
```

**Lokasi Code**:
```typescript
// Line ~150-180 di nlp-result-storage.service.ts
private async calculateRecommendationScore(destinationId: number) {
  const reviews = await this.prisma.review.findMany({
    where: { destinationId, sentiment: { not: null } },
    select: { sentiment: true },
  });

  const totalReviews = reviews.length;
  const positiveCount = reviews.filter(r => r.sentiment === 'positive').length;
  const positiveRatio = positiveCount / totalReviews;

  const dest = await this.prisma.destination.findUnique({
    where: { id: destinationId },
    select: { userRating: true, googleRating: true },
  });

  const userRating = dest?.userRating ?? dest?.googleRating ?? 0;
  const normalizedRating = userRating / 5;
  
  // Formula: 50% rating + 50% sentiment
  const recommendationScore = normalizedRating * 0.5 + positiveRatio * 0.5;

  await this.prisma.destination.update({
    where: { id: destinationId },
    data: { positiveRatio, recommendationScore },
  });
}
```

**Contoh Data Tersimpan**:
```javascript
// Destination table (UPDATED)
{
  id: 1,
  name: 'Jam Gadang',
  // ... other fields
  positiveRatio: 0.5783,           // 12 positive / (12+2+1) = 0.8
  recommendationScore: 0.2892      // (0 * 0.5) + (0.8 * 0.5) = 0.4
}
```

#### 3.6 Update Destination Topics
**Tabel: `DestinationTopic`**

```sql
-- Untuk setiap topic yang muncul di reviews destination ini
INSERT INTO "DestinationTopic" (
  "destinationId",
  "topicId",
  "totalReviews"    -- count reviews dengan topic ini
)
ON CONFLICT ("destinationId", "topicId") DO UPDATE
SET "totalReviews" = EXCLUDED."totalReviews"
```

**Lokasi Code**:
```typescript
// Line ~185-210 di nlp-result-storage.service.ts
private async updateDestinationTopics(destinationId: number) {
  const reviews = await this.prisma.review.findMany({
    where: { destinationId, topicId: { not: null } },
    select: { topicId: true },
  });

  const topicCounts: Record<number, number> = {};
  for (const r of reviews) {
    const tId = r.topicId as number;
    topicCounts[tId] = (topicCounts[tId] || 0) + 1;
  }

  for (const [topicIdStr, count] of Object.entries(topicCounts)) {
    const topicId = parseInt(topicIdStr, 10);
    await this.prisma.destinationTopic.upsert({
      where: { destinationId_topicId: { destinationId, topicId } },
      create: { destinationId, topicId, totalReviews: count },
      update: { totalReviews: count },
    });
  }
}
```

**Contoh Data Tersimpan**:
```javascript
// DestinationTopic table
[
  { destinationId: 1, topicId: 23, totalReviews: 3 },  // 3 reviews tentang "indah"
  { destinationId: 1, topicId: 82, totalReviews: 2 },  // 2 reviews tentang "weekend"
  { destinationId: 1, topicId: 40, totalReviews: 5 }   // 5 reviews tentang "nyaman"
]
```

#### 3.7 Update Sentiment Trends
**Tabel: `SentimentTrend`**

```sql
-- Group by month, hitung sentiment per bulan
INSERT INTO "SentimentTrend" (
  "destinationId",
  "date",              -- first day of month
  "positiveCount",
  "negativeCount",
  "neutralCount"
)
ON CONFLICT ("destinationId", "date") DO UPDATE
SET
  "positiveCount" = EXCLUDED."positiveCount",
  "negativeCount" = EXCLUDED."negativeCount",
  "neutralCount" = EXCLUDED."neutralCount"
```

**Lokasi Code**:
```typescript
// Line ~215-250 di nlp-result-storage.service.ts
private async updateSentimentTrends(destinationId: number) {
  const reviews = await this.prisma.review.findMany({
    where: { destinationId, reviewDate: { not: null } },
    select: { reviewDate: true, sentiment: true },
  });

  const trends: Record<string, { pos: number; neg: number; neu: number }> = {};

  for (const r of reviews) {
    if (!r.reviewDate) continue;
    // Group by first day of the month
    const dateStr = new Date(
      r.reviewDate.getFullYear(),
      r.reviewDate.getMonth(),
      1,
    ).toISOString();
    
    if (!trends[dateStr]) {
      trends[dateStr] = { pos: 0, neg: 0, neu: 0 };
    }

    if (r.sentiment === 'positive') trends[dateStr].pos++;
    else if (r.sentiment === 'negative') trends[dateStr].neg++;
    else trends[dateStr].neu++;
  }

  for (const [dateStr, counts] of Object.entries(trends)) {
    const date = new Date(dateStr);
    await this.prisma.sentimentTrend.upsert({
      where: { destinationId_date: { destinationId, date } },
      create: { destinationId, date, positiveCount: counts.pos, negativeCount: counts.neg, neutralCount: counts.neu },
      update: { positiveCount: counts.pos, negativeCount: counts.neg, neutralCount: counts.neu },
    });
  }
}
```

**Contoh Data Tersimpan**:
```javascript
// SentimentTrend table
[
  { destinationId: 1, date: '2024-03-01', positiveCount: 24, negativeCount: 0, neutralCount: 54 },
  { destinationId: 1, date: '2024-02-01', positiveCount: 8, negativeCount: 0, neutralCount: 31 },
  { destinationId: 1, date: '2024-01-01', positiveCount: 12, negativeCount: 1, neutralCount: 20 }
]
```

---

## 📋 RINGKASAN TABEL DATABASE

### Data yang Disimpan Saat Upload CSV:
1. ✅ **ScrapingJob** - metadata job scraping
2. ✅ **Review** - data review mentah (reviewText, rating, dll)

### Data yang Disimpan Setelah NLP Processing:
3. ✅ **Topic** - topics dengan keywords
4. ✅ **Review** (UPDATE) - tambah cleanedText, sentiment, topicId
5. ✅ **ReviewEmbedding** - vector embeddings per review
6. ✅ **DestinationEmbedding** - average embedding destination
7. ✅ **Destination** (UPDATE) - tambah positiveRatio, recommendationScore
8. ✅ **DestinationTopic** - relasi destination-topic dengan count
9. ✅ **SentimentTrend** - trend sentiment per bulan

---

## 🔍 Cara Cek Data di Database

### 1. Cek Scraping Job
```sql
SELECT * FROM "ScrapingJob" ORDER BY "createdAt" DESC LIMIT 5;
```

### 2. Cek Reviews (sebelum NLP)
```sql
SELECT id, "reviewText", "cleanedText", sentiment, "topicId" 
FROM "Review" 
WHERE "scrapingJobId" = 16;
```

### 3. Cek Topics
```sql
SELECT * FROM "Topic" ORDER BY id;
```

### 4. Cek Review Embeddings
```sql
SELECT "reviewId", array_length(embedding, 1) as embedding_dim
FROM "ReviewEmbedding"
WHERE "reviewId" IN (SELECT id FROM "Review" WHERE "scrapingJobId" = 16);
```

### 5. Cek Destination Analytics
```sql
SELECT name, "positiveRatio", "recommendationScore"
FROM "Destination"
WHERE id = 1;
```

### 6. Cek Destination Topics
```sql
SELECT dt.*, t."topicName", t.keywords
FROM "DestinationTopic" dt
JOIN "Topic" t ON dt."topicId" = t.id
WHERE dt."destinationId" = 1;
```

### 7. Cek Sentiment Trends
```sql
SELECT * FROM "SentimentTrend"
WHERE "destinationId" = 1
ORDER BY date DESC;
```

---

## 🎯 File-File Penting

| File | Fungsi |
|------|--------|
| `uploads.controller.ts` | Endpoint upload CSV |
| `uploads.service.ts` | Simpan ScrapingJob & Review |
| `nlp-process.processor.ts` | Worker NLP processing |
| `nlp.service.ts` | Kirim request ke FastAPI |
| `nlp-result-storage.service.ts` | **SIMPAN SEMUA HASIL NLP** |
| `vector.service.ts` | Simpan embeddings |

---

## ✅ Verifikasi

Gunakan script `check-db-results.js` untuk verifikasi:
```bash
node check-db-results.js
```

Output akan menampilkan:
- ✅ Scraping jobs
- ✅ Reviews dengan sentiment & topic
- ✅ Topics yang dibuat
- ✅ Embeddings count
- ✅ Destination analytics
- ✅ Sentiment trends
