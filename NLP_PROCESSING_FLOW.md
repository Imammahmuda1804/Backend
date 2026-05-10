# NLP Processing Flow - Complete Documentation

## 📋 Overview

Ketika admin upload file CSV/Excel berisi review data, sistem akan menjalankan pipeline NLP lengkap untuk menganalisis sentiment, mengekstrak topik, dan membuat vector embeddings untuk semantic search.

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN UPLOAD FILE                             │
│              POST /api/admin/destinations/:id/upload-reviews     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: FILE VALIDATION & PARSING                              │
│  ─────────────────────────────────────────────────────────────  │
│  ✓ Validate file format (.csv, .xlsx, .xls)                     │
│  ✓ Check file size (max 10MB)                                   │
│  ✓ Parse CSV/Excel to JSON                                      │
│  ✓ Validate required columns (review_text)                      │
│  ✓ Map columns to database fields                               │
│                                                                   │
│  Input:  CSV Buffer                                              │
│  Output: Array of validated review objects                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: CREATE SCRAPING JOB                                    │
│  ─────────────────────────────────────────────────────────────  │
│  ✓ Create ScrapingJob record                                    │
│    - status: 'completed'                                         │
│    - source: 'upload'                                            │
│    - totalReviews: count                                         │
│    - createdBy: adminId                                          │
│                                                                   │
│  Database: INSERT INTO scraping_jobs                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: SAVE RAW REVIEWS                                       │
│  ─────────────────────────────────────────────────────────────  │
│  ✓ Map CSV columns to Review fields:                            │
│    - reviewerName (from: name, author, user)                    │
│    - reviewText (from: text, review, content)                   │
│    - rating (from: rating, star, score)                         │
│    - reviewDate (from: date, time, published)                   │
│    - likesCount (from: like, helpful)                           │
│                                                                   │
│  ✓ Batch insert all reviews                                     │
│                                                                   │
│  Database: INSERT INTO reviews (batch)                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: QUEUE NLP PROCESSING                                   │
│  ─────────────────────────────────────────────────────────────  │
│  ✓ Add job to BullMQ queue                                      │
│    - Queue: 'nlp-queue'                                          │
│    - Job data: { jobId, destinationId }                         │
│                                                                   │
│  ✓ Return response immediately (202 Accepted)                   │
│                                                                   │
│  Response: {                                                     │
│    message: "File uploaded and NLP processing started",         │
│    job_id: 123,                                                  │
│    total_rows: 100                                               │
│  }                                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ [BACKGROUND PROCESSING STARTS]
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: NLP PROCESSOR (Background Worker)                      │
│  ─────────────────────────────────────────────────────────────  │
│  ✓ Fetch all reviews for the job                                │
│  ✓ Prepare CSV format for FastAPI:                              │
│    - index, text                                                 │
│    - 0, "Tempat yang bagus..."                                  │
│    - 1, "Pemandangan indah..."                                  │
│                                                                   │
│  ✓ Convert to Buffer                                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 6: CALL FASTAPI NLP SERVICE                               │
│  ─────────────────────────────────────────────────────────────  │
│  POST http://localhost:8001/pipeline/process                    │
│  Content-Type: multipart/form-data                              │
│  Body: CSV file                                                  │
│  Timeout: 5 minutes                                              │
│                                                                   │
│  FastAPI Processing:                                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 1. Text Cleaning                                          │  │
│  │    - Lowercase                                            │  │
│  │    - Remove special characters                            │  │
│  │    - Remove stopwords                                     │  │
│  │                                                            │  │
│  │ 2. Sentiment Analysis                                     │  │
│  │    - Model: IndoBERT/mBERT                                │  │
│  │    - Output: positive/negative/neutral                    │  │
│  │                                                            │  │
│  │ 3. Topic Modeling                                         │  │
│  │    - Algorithm: LDA (Latent Dirichlet Allocation)        │  │
│  │    - Extract 5 topics                                     │  │
│  │    - Assign topic to each review                          │  │
│  │                                                            │  │
│  │ 4. Text Embedding                                         │  │
│  │    - Model: sentence-transformers                         │  │
│  │    - Dimension: 384                                       │  │
│  │    - Per-review embedding                                 │  │
│  │    - Destination-level embedding (average)                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Response: NlpPipelineResult {                                   │
│    reviews: [                                                    │
│      {                                                           │
│        index: 0,                                                 │
│        cleaned_text: "tempat bagus",                            │
│        sentiment: "positive",                                    │
│        topic_id: 1,                                              │
│        topic_name: "Pemandangan",                               │
│        embedding: [0.123, -0.456, ...]  // 384 dimensions      │
│      },                                                          │
│      ...                                                         │
│    ],                                                            │
│    topics: [                                                     │
│      {                                                           │
│        id: 1,                                                    │
│        name: "Pemandangan",                                     │
│        keywords: ["indah", "cantik", "view"]                    │
│      },                                                          │
│      ...                                                         │
│    ],                                                            │
│    destination_embedding: [0.789, -0.234, ...]  // 384 dims    │
│  }                                                               │
│                                                                   │
│  ⚠️ FALLBACK (Development Only):                                │
│  If FastAPI unavailable:                                         │
│  - Generate dummy sentiment based on rating                     │
│  - Generate random embeddings                                   │
│  - No topics assigned                                            │
│  - Production: Throw error instead                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 7: SAVE NLP RESULTS TO DATABASE                           │
│  ─────────────────────────────────────────────────────────────  │
│  7.1 Save/Update Topics                                         │
│      ✓ UPSERT topics table                                      │
│      ✓ Store topic names and keywords                           │
│                                                                   │
│  7.2 Update Reviews                                              │
│      ✓ UPDATE reviews SET:                                      │
│        - cleanedText                                             │
│        - sentiment (positive/negative/neutral)                  │
│        - topicId                                                 │
│                                                                   │
│  7.3 Save Review Embeddings                                      │
│      ✓ INSERT INTO review_embeddings                            │
│      ✓ Store 384-dimensional vectors                            │
│      ✓ Enable pgvector indexing for fast search                │
│                                                                   │
│  7.4 Update Destination Embedding                                │
│      ✓ UPSERT destination_embeddings                            │
│      ✓ Store aggregated 384-dimensional vector                  │
│                                                                   │
│  Database Operations:                                            │
│  - INSERT/UPDATE topics (5 records)                             │
│  - UPDATE reviews (100 records)                                 │
│  - INSERT review_embeddings (100 records)                       │
│  - UPSERT destination_embeddings (1 record)                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 8: CALCULATE ANALYTICS                                    │
│  ─────────────────────────────────────────────────────────────  │
│  8.1 Calculate Recommendation Score                             │
│      Formula:                                                    │
│      recommendationScore = (userRating/5 * 0.5) +               │
│                           (positiveRatio * 0.5)                 │
│                                                                   │
│      Example:                                                    │
│      - userRating: 4.5                                           │
│      - positiveRatio: 0.85 (85% positive reviews)               │
│      - recommendationScore: (4.5/5 * 0.5) + (0.85 * 0.5)        │
│                           = 0.45 + 0.425 = 0.875 (87.5%)        │
│                                                                   │
│      ✓ UPDATE destinations SET:                                 │
│        - positiveRatio                                           │
│        - recommendationScore                                     │
│                                                                   │
│  8.2 Update Destination Topics                                   │
│      ✓ Count reviews per topic                                  │
│      ✓ UPSERT destination_topics                                │
│      ✓ Store totalReviews per topic                             │
│                                                                   │
│      Example:                                                    │
│      - Topic "Pemandangan": 45 reviews                          │
│      - Topic "Fasilitas": 30 reviews                            │
│      - Topic "Harga": 25 reviews                                │
│                                                                   │
│  8.3 Update Sentiment Trends                                     │
│      ✓ Group reviews by month                                   │
│      ✓ Count positive/negative/neutral per month                │
│      ✓ UPSERT sentiment_trends                                  │
│                                                                   │
│      Example:                                                    │
│      - Jan 2024: 20 pos, 5 neg, 3 neu                           │
│      - Feb 2024: 25 pos, 3 neg, 2 neu                           │
│      - Mar 2024: 30 pos, 2 neg, 1 neu                           │
│                                                                   │
│  Database Operations:                                            │
│  - UPDATE destinations (1 record)                               │
│  - UPSERT destination_topics (5 records)                        │
│  - UPSERT sentiment_trends (N records)                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 9: PROCESSING COMPLETE                                    │
│  ─────────────────────────────────────────────────────────────  │
│  ✓ All data saved to database                                   │
│  ✓ Analytics updated                                            │
│  ✓ Ready for semantic search                                    │
│  ✓ Ready for analytics queries                                  │
│                                                                   │
│  Log: "NLP process completed for job 123"                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow Summary

### Input (CSV File):
```csv
reviewer_name,review_text,rating,review_date,likes_count
John Doe,Tempat yang sangat indah!,5,2024-01-15,10
Jane Smith,Bagus tapi agak ramai.,4,2024-01-20,5
```

### After Processing:

#### 1. Reviews Table:
```sql
id | destinationId | reviewText              | cleanedText        | sentiment | topicId | rating
1  | 1             | Tempat yang sangat...   | tempat indah       | positive  | 1       | 5
2  | 1             | Bagus tapi agak ramai   | bagus ramai        | positive  | 2       | 4
```

#### 2. Review Embeddings Table:
```sql
reviewId | embedding (384 dimensions)
1        | [0.123, -0.456, 0.789, ...]
2        | [0.234, -0.567, 0.890, ...]
```

#### 3. Topics Table:
```sql
id | topicName     | keywords
1  | Pemandangan   | ["indah", "cantik", "view"]
2  | Fasilitas     | ["lengkap", "bersih", "nyaman"]
```

#### 4. Destination Topics Table:
```sql
destinationId | topicId | totalReviews
1             | 1       | 45
1             | 2       | 30
```

#### 5. Sentiment Trends Table:
```sql
destinationId | date       | positiveCount | negativeCount | neutralCount
1             | 2024-01-01 | 20            | 5             | 3
1             | 2024-02-01 | 25            | 3             | 2
```

#### 6. Destinations Table (Updated):
```sql
id | name      | positiveRatio | recommendationScore
1  | Jam Gadang| 0.85          | 0.875
```

---

## ⏱️ Processing Time Estimates

| Step | Time | Notes |
|------|------|-------|
| File Upload & Validation | < 1s | Synchronous |
| Save to Database | < 2s | Synchronous |
| Queue Job | < 0.1s | Synchronous |
| **Total Response Time** | **< 3s** | **User gets 202 response** |
| | | |
| NLP Processing (FastAPI) | 10-60s | Background, depends on file size |
| Save NLP Results | 5-10s | Background |
| Calculate Analytics | 2-5s | Background |
| **Total Background Time** | **17-75s** | **Async processing** |

### Performance Notes:
- **100 reviews**: ~20 seconds total
- **1000 reviews**: ~2 minutes total
- **5000 reviews**: ~8 minutes total

---

## 🔍 What Happens After Processing?

### 1. Semantic Search Enabled
```
POST /api/search
{
  "query": "tempat dengan pemandangan indah"
}
```
Returns destinations ranked by:
- Vector similarity (70%)
- Keyword match (30%)

### 2. Analytics Available
```
GET /api/analytics/destination/1
```
Returns:
- Sentiment distribution
- Topic breakdown
- Recommendation score
- Trend analysis

### 3. Topic Filtering
```
GET /api/topics/1/destinations
```
Returns destinations with specific topic

### 4. Comparison
```
GET /api/analytics/compare?destination1=1&destination2=2
```
Compare two destinations side-by-side

---

## 🛠️ Monitoring & Debugging

### Check Job Status:
```
GET /api/admin/scraper/status/:jobId
```

Response:
```json
{
  "id": 123,
  "status": "completed",
  "source": "upload",
  "totalReviews": 100,
  "startedAt": "2024-01-15T10:00:00Z",
  "finishedAt": "2024-01-15T10:00:02Z"
}
```

### Check Processing Logs:
```bash
# Server logs will show:
[NestApplication] File uploaded and NLP processing started
[NlpProcessProcessor] Processing NLP for job 123, destination 1
[NlpService] Calling FastAPI at http://localhost:8001
[NlpProcessProcessor] NLP process completed for job 123
```

### Check Database:
```sql
-- Check reviews
SELECT id, sentiment, topicId FROM reviews WHERE scrapingJobId = 123;

-- Check embeddings
SELECT COUNT(*) FROM review_embeddings 
WHERE reviewId IN (SELECT id FROM reviews WHERE scrapingJobId = 123);

-- Check analytics
SELECT positiveRatio, recommendationScore FROM destinations WHERE id = 1;
```

---

## ⚠️ Error Handling

### Scenario 1: FastAPI Not Running

**What Happens:**
1. NLP service call fails with ECONNREFUSED
2. **Development**: Falls back to dummy data
   - Sentiment based on rating
   - Random embeddings
   - No topics
3. **Production**: Throws error, job fails

**Solution:**
- Start FastAPI service: `uvicorn main:app --port 8001`
- Check health: `curl http://localhost:8001/health`

### Scenario 2: Invalid CSV Format

**What Happens:**
1. File parser throws BadRequestException
2. Returns 400 error immediately
3. No data saved to database

**Solution:**
- Check CSV has required columns
- Use sample-reviews.csv as template

### Scenario 3: Database Connection Lost

**What Happens:**
1. Prisma throws connection error
2. Transaction rolled back
3. Job marked as failed

**Solution:**
- Check PostgreSQL container: `docker ps`
- Restart if needed: `docker-compose restart db`

### Scenario 4: Processing Timeout

**What Happens:**
1. FastAPI timeout (5 minutes)
2. Job marked as failed
3. Partial data may be saved

**Solution:**
- Split large files into smaller batches
- Increase timeout in nlp.service.ts

---

## 🎯 Key Features

### 1. **Asynchronous Processing**
- User gets immediate response (202 Accepted)
- Heavy processing happens in background
- No blocking of API requests

### 2. **Fault Tolerance**
- Development fallback for missing FastAPI
- Transaction rollback on errors
- Retry mechanism in BullMQ

### 3. **Scalability**
- BullMQ handles job queuing
- Can process multiple uploads concurrently
- Redis-backed queue persistence

### 4. **Data Quality**
- Column name flexibility (auto-detection)
- Data validation before processing
- Cleaned text for better NLP results

### 5. **Rich Analytics**
- Multi-dimensional analysis
- Time-series trends
- Topic distribution
- Recommendation scoring

---

## 📈 Database Impact

### Tables Modified:
1. ✅ `scraping_jobs` - 1 INSERT
2. ✅ `reviews` - N INSERTs, N UPDATEs
3. ✅ `review_embeddings` - N INSERTs
4. ✅ `topics` - 5 UPSERTs
5. ✅ `destination_topics` - 5 UPSERTs
6. ✅ `sentiment_trends` - M UPSERTs
7. ✅ `destinations` - 1 UPDATE
8. ✅ `destination_embeddings` - 1 UPSERT

### Indexes Used:
- `reviews.scrapingJobId` - For fetching job reviews
- `reviews.destinationId` - For analytics
- `review_embeddings.reviewId` - For vector search
- `destination_embeddings.destinationId` - For semantic search

---

## 🚀 Performance Optimization

### Current Implementation:
- ✅ Batch inserts for reviews
- ✅ Batch inserts for embeddings
- ✅ Upsert for idempotency
- ✅ Background processing
- ✅ Connection pooling (pg)

### Future Improvements:
- 🔄 Parallel NLP processing (split batches)
- 🔄 Caching for frequent queries
- 🔄 Incremental analytics updates
- 🔄 Streaming for large files

---

**Last Updated**: 2026-05-08  
**Version**: 1.0.0
