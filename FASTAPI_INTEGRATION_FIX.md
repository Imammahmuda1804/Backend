# FastAPI Integration Fix - NLP Pipeline

## 🎯 Masalah yang Diperbaiki

### 1. Interface Mismatch
**Masalah**: Interface `NlpPipelineResult` di NestJS tidak sesuai dengan response sebenarnya dari FastAPI.

**NestJS Interface (Lama)**:
```typescript
{
  summary: { total_reviews, processing_time },
  results: [{ index, cleaned_text, sentiment, topic_id, topic_name, embedding }],
  topics: [{ topic_id, keywords }],
  destination_embedding: []
}
```

**FastAPI Response (Aktual)**:
```json
{
  "summary": { "total": 15, "positive": 12, "negative": 1, "neutral": 2 },
  "results": [
    {
      "text": "...",
      "cleaned_text": "...",
      "sentiment": "positif",
      "topic_id": 23,
      "embedding": [...]
    }
  ],
  "topics": [{ "topic_id": 4, "keywords": [...] }]
}
```

**Perbedaan Utama**:
1. ❌ `summary` struktur berbeda (total_reviews vs total, tidak ada processing_time)
2. ❌ `results` memiliki field `text` bukan `index`
3. ❌ Tidak ada `topic_name` di results
4. ❌ Tidak ada `destination_embedding` di response
5. ❌ Sentiment menggunakan bahasa Indonesia: "positif/negatif/netral"

### 2. Sentiment Mapping
**Masalah**: FastAPI mengembalikan sentiment dalam bahasa Indonesia, tapi database mengharapkan English.

**Solusi**: Menambahkan mapping function di `NlpResultStorageService`:
```typescript
const mapSentiment = (sentiment: string): string => {
  const sentimentMap: Record<string, string> = {
    'positif': 'positive',
    'negatif': 'negative',
    'netral': 'neutral',
  };
  return sentimentMap[sentiment.toLowerCase()] || sentiment;
};
```

### 3. Missing Destination Embedding
**Masalah**: FastAPI tidak mengembalikan `destination_embedding`.

**Solusi**: Menghitung destination embedding sebagai rata-rata dari semua review embeddings:
```typescript
// Calculate average of all review embeddings
const validEmbeddings = nlpResult.results
  .filter((r) => r.embedding && r.embedding.length > 0)
  .map((r) => r.embedding);

if (validEmbeddings.length > 0) {
  const embeddingDim = validEmbeddings[0].length;
  const destinationEmbedding = new Array(embeddingDim).fill(0);

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

### 4. Index Mapping
**Masalah**: Response FastAPI tidak memiliki field `index`, tapi kita perlu mapping ke `reviewIds`.

**Solusi**: Menggunakan array index untuk mapping:
```typescript
// Update Reviews
for (let index = 0; index < nlpResult.results.length; index++) {
  const review = nlpResult.results[index];
  const realReviewId = reviewIds[index];
  // ...
}
```

## 📝 File yang Diubah

### 1. `src/modules/nlp/interfaces/nlp-pipeline-result.interface.ts`
**Perubahan**: Update interface untuk match dengan response FastAPI

```typescript
export interface NlpPipelineResult {
  summary: {
    total: number;
    positive: number;
    negative: number;
    neutral: number;
  };
  results: Array<{
    text: string;
    cleaned_text: string;
    sentiment: string; // "positif", "negatif", "netral"
    topic_id: number | null;
    embedding: number[];
  }>;
  topics: Array<{
    topic_id: number;
    keywords: string[];
  }>;
}
```

### 2. `src/modules/nlp/nlp-result-storage.service.ts`
**Perubahan**:
- ✅ Menambahkan sentiment mapping (Indonesia → English)
- ✅ Menggunakan array index untuk mapping reviewIds
- ✅ Menghitung destination embedding dari rata-rata review embeddings
- ✅ Menambahkan logging untuk debugging

**Key Changes**:
```typescript
// Map sentiment dari Indonesia ke English
const mappedSentiment = mapSentiment(review.sentiment);

// Update dengan index-based mapping
for (let index = 0; index < nlpResult.results.length; index++) {
  const review = nlpResult.results[index];
  const realReviewId = reviewIds[index];
  // ...
}

// Calculate destination embedding
const destinationEmbedding = calculateAverageEmbedding(validEmbeddings);
```

### 3. `src/modules/scraper/nlp-process.processor.ts`
**Perubahan**:
- ✅ Update fallback data untuk match format FastAPI
- ✅ Menambahkan logging untuk success case
- ✅ Update fallback sentiment ke bahasa Indonesia

**Key Changes**:
```typescript
// Fallback match FastAPI format
nlpResult = {
  summary: {
    total: reviews.length,
    positive: positiveCount,
    negative: negativeCount,
    neutral: neutralCount,
  },
  results: reviews.map((r, i) => ({
    text: r.reviewText || '',
    cleaned_text: r.reviewText?.toLowerCase() || '',
    sentiment: r.rating >= 4 ? 'positif' : r.rating <= 2 ? 'negatif' : 'netral',
    topic_id: null,
    embedding: generateDummyEmbedding(i),
  })),
  topics: [],
};
```

## 🔄 Flow Proses NLP (Updated)

```
1. Upload CSV → Parse Reviews
   ↓
2. Create Scraping Job → Save Reviews to DB
   ↓
3. Queue NLP Processing Job
   ↓
4. NlpProcessProcessor:
   - Ambil reviews dari DB
   - Format ke CSV dengan kolom Indonesia
   - Kirim ke FastAPI: POST http://localhost:8001/pipeline/process
   ↓
5. FastAPI Response:
   {
     summary: { total, positive, negative, neutral },
     results: [{ text, cleaned_text, sentiment, topic_id, embedding }],
     topics: [{ topic_id, keywords }]
   }
   ↓
6. NlpResultStorageService:
   - Map sentiment: "positif" → "positive"
   - Save topics ke DB
   - Update reviews dengan cleaned_text, sentiment, topicId
   - Save review embeddings
   - Calculate & save destination embedding (average)
   - Update analytics (recommendation score)
   - Update destination topics
   - Update sentiment trends
```

## ✅ Testing

### 1. Build Project
```bash
npm run build
```
**Expected**: Build berhasil tanpa error TypeScript

### 2. Start Server
```bash
# Kill proses lama jika ada
netstat -ano | findstr :3000
taskkill /F /PID <PID>

# Start server baru
npm run start:dev
```

### 3. Test Upload
```bash
node test-upload.js
```

**Expected Response**:
```json
{
  "message": "File uploaded and processing started",
  "jobId": 7,
  "reviewsCount": 15,
  "destinationId": 1
}
```

### 4. Check Logs
Monitor server logs untuk melihat:
- ✅ FastAPI endpoint dipanggil
- ✅ Response diterima dengan benar
- ✅ Data disimpan ke database
- ✅ Analytics dihitung

**Expected Logs**:
```
[NlpProcessProcessor] Processing NLP for job 7, destination 1
[NlpProcessProcessor] ✅ FastAPI returned 15 results
📊 NLP Result Summary: { "total": 15, "positive": 12, "negative": 1, "neutral": 2 }
📊 NLP Result Topics: [...]
📊 NLP Result Results (first 2): [...]
[NlpProcessProcessor] NLP process completed for job 7
```

### 5. Verify Database
```sql
-- Check reviews updated
SELECT id, sentiment, "topicId", "cleanedText" 
FROM "Review" 
WHERE "scrapingJobId" = 7;

-- Check topics created
SELECT * FROM "Topic";

-- Check embeddings saved
SELECT COUNT(*) FROM "ReviewEmbedding" 
WHERE "reviewId" IN (SELECT id FROM "Review" WHERE "scrapingJobId" = 7);

-- Check destination embedding
SELECT COUNT(*) FROM "DestinationEmbedding" WHERE "destinationId" = 1;

-- Check analytics updated
SELECT "positiveRatio", "recommendationScore" 
FROM "Destination" 
WHERE id = 1;
```

## 🐛 Troubleshooting

### Error: "Kolom referensi teks 'Teks Ulasan' tidak ditemukan"
**Penyebab**: CSV yang dikirim tidak memiliki kolom "Teks Ulasan"

**Solusi**: Sudah diperbaiki di `nlp-process.processor.ts` - CSV sekarang menggunakan nama kolom Indonesia yang benar.

### Error: "Cannot read property 'index' of undefined"
**Penyebab**: Interface lama menggunakan `review.index` tapi FastAPI tidak mengembalikan field ini

**Solusi**: Sudah diperbaiki - menggunakan array index untuk mapping.

### Sentiment tidak tersimpan dengan benar
**Penyebab**: FastAPI mengembalikan "positif/negatif/netral" tapi database mengharapkan "positive/negative/neutral"

**Solusi**: Sudah diperbaiki dengan sentiment mapping function.

### Destination embedding tidak tersimpan
**Penyebab**: FastAPI tidak mengembalikan `destination_embedding`

**Solusi**: Sudah diperbaiki - menghitung dari rata-rata review embeddings.

## 📚 Referensi

- FastAPI Endpoint: `http://localhost:8001/pipeline/process`
- Method: POST
- Content-Type: multipart/form-data
- Key: `file`
- File Format: CSV dengan kolom Indonesia (Teks Ulasan, Nama Pengulas, Rating, dll)

## 🎉 Status

✅ **SELESAI** - Semua perubahan telah diimplementasikan dan build berhasil.

**Next Steps**:
1. Restart NestJS server: `npm run start:dev`
2. Test upload dengan `node test-upload.js`
3. Verify data di database
4. Monitor logs untuk memastikan tidak ada error
