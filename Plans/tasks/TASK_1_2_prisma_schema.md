# Task 1.2 — Prisma Schema & Database Migration

> **Phase:** 1 - Foundation & Setup
> **Status:** ⬜ Belum Dimulai
> **Estimasi:** 3-4 jam
> **Dependencies:** Task 1.1

---

## Objective

Membuat Prisma schema lengkap untuk semua tabel database sesuai Requirements.md §8, setup pgvector extension, dan jalankan migrasi.

---

## Steps

### 1. Inisialisasi Prisma

```bash
npx prisma init
```

### 2. Buat Schema Prisma (`prisma/schema.prisma`)

Definisikan semua model berikut:

#### Model: User

```prisma
model User {
  id         Int       @id @default(autoincrement())
  name       String
  email      String    @unique
  password   String
  role       Role      @default(USER)
  status     String    @default("active")
  createdAt  DateTime  @default(now()) @map("created_at")
  updatedAt  DateTime  @updatedAt @map("updated_at")

  favorites     Favorite[]
  searchLogs    SearchLog[]
  userReviews   UserReview[]
  scrapingJobs  ScrapingJob[]

  @@map("users")
}

enum Role {
  ADMIN
  USER
}
```

#### Model: Destination

```prisma
model Destination {
  id               Int       @id @default(autoincrement())
  name             String
  slug             String    @unique
  description      String?

  city             String
  province         String

  latitude         Float?
  longitude        Float?

  googleMapsUrl    String?   @map("google_maps_url")
  googlePlaceId    String?   @map("google_place_id")

  googleRating     Float?    @map("google_rating")
  googleReviewCount Int?     @map("google_review_count")

  userRating       Float?    @map("user_rating")
  userReviewCount  Int?      @map("user_review_count")

  youtubeUrl       String?   @map("youtube_url")
  thumbnailUrl     String?   @map("thumbnail_url")

  embedding        Unsupported("vector(384)")?

  positiveRatio       Float?  @map("positive_ratio")
  recommendationScore Float?  @map("recommendation_score")

  createdAt  DateTime   @default(now()) @map("created_at")
  updatedAt  DateTime   @updatedAt @map("updated_at")
  deletedAt  DateTime?  @map("deleted_at")

  images            DestinationImage[]
  reviews           Review[]
  sentimentTrends   SentimentTrend[]
  favorites         Favorite[]
  userReviews       UserReview[]
  destinationTopics DestinationTopic[]
  scrapingJobs      ScrapingJob[]
  scrapingHistories ScrapingHistory[]

  @@map("destinations")
}
```

#### Model: DestinationImage

```prisma
model DestinationImage {
  id            Int          @id @default(autoincrement())
  destinationId Int          @map("destination_id")
  imageUrl      String       @map("image_url")
  createdAt     DateTime     @default(now()) @map("created_at")

  destination   Destination  @relation(fields: [destinationId], references: [id], onDelete: Cascade)

  @@map("destination_images")
}
```

#### Model: Review

```prisma
model Review {
  id            Int       @id @default(autoincrement())
  destinationId Int       @map("destination_id")
  reviewerName  String    @map("reviewer_name")
  reviewText    String?   @map("review_text")
  cleanedText   String?   @map("cleaned_text")
  rating        Int?
  reviewDate    DateTime? @map("review_date")
  source        String?
  likesCount    Int?      @map("likes_count")
  ownerReply    String?   @map("owner_reply")
  sentiment     String?
  topicId       Int?      @map("topic_id")
  createdAt     DateTime  @default(now()) @map("created_at")

  destination      Destination       @relation(fields: [destinationId], references: [id], onDelete: Cascade)
  topic            Topic?            @relation(fields: [topicId], references: [id])
  reviewEmbedding  ReviewEmbedding?

  @@map("reviews")
}
```

#### Model: ReviewEmbedding

```prisma
model ReviewEmbedding {
  id        Int    @id @default(autoincrement())
  reviewId  Int    @unique @map("review_id")
  embedding Unsupported("vector(384)")?

  review    Review @relation(fields: [reviewId], references: [id], onDelete: Cascade)

  @@map("review_embeddings")
}
```

#### Model: Topic

```prisma
model Topic {
  id        Int      @id @default(autoincrement())
  topicName String   @map("topic_name")
  keywords  Json?
  createdAt DateTime @default(now()) @map("created_at")

  reviews           Review[]
  destinationTopics DestinationTopic[]

  @@map("topics")
}
```

#### Model: DestinationTopic

```prisma
model DestinationTopic {
  id            Int @id @default(autoincrement())
  destinationId Int @map("destination_id")
  topicId       Int @map("topic_id")
  totalReviews  Int @default(0) @map("total_reviews")

  destination Destination @relation(fields: [destinationId], references: [id], onDelete: Cascade)
  topic       Topic       @relation(fields: [topicId], references: [id], onDelete: Cascade)

  @@unique([destinationId, topicId])
  @@map("destination_topics")
}
```

#### Model: SentimentTrend

```prisma
model SentimentTrend {
  id             Int      @id @default(autoincrement())
  destinationId  Int      @map("destination_id")
  date           DateTime
  positiveCount  Int      @default(0) @map("positive_count")
  negativeCount  Int      @default(0) @map("negative_count")
  neutralCount   Int      @default(0) @map("neutral_count")

  destination Destination @relation(fields: [destinationId], references: [id], onDelete: Cascade)

  @@unique([destinationId, date])
  @@map("sentiment_trends")
}
```

#### Model: Favorite

```prisma
model Favorite {
  id            Int      @id @default(autoincrement())
  userId        Int      @map("user_id")
  destinationId Int      @map("destination_id")
  createdAt     DateTime @default(now()) @map("created_at")

  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  destination Destination @relation(fields: [destinationId], references: [id], onDelete: Cascade)

  @@unique([userId, destinationId])
  @@map("favorites")
}
```

#### Model: SearchLog

```prisma
model SearchLog {
  id        Int      @id @default(autoincrement())
  userId    Int?     @map("user_id")
  keyword   String
  createdAt DateTime @default(now()) @map("created_at")

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@map("search_logs")
}
```

#### Model: UserReview

```prisma
model UserReview {
  id            Int      @id @default(autoincrement())
  userId        Int      @map("user_id")
  destinationId Int      @map("destination_id")
  rating        Int
  reviewText    String?  @map("review_text")
  createdAt     DateTime @default(now()) @map("created_at")

  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  destination Destination @relation(fields: [destinationId], references: [id], onDelete: Cascade)

  @@map("user_reviews")
}
```

#### Model: ScrapingJob

```prisma
model ScrapingJob {
  id            Int       @id @default(autoincrement())
  destinationId Int       @map("destination_id")
  status        String    @default("pending")
  source        String    @default("google_maps")
  totalReviews  Int?      @map("total_reviews")
  startedAt     DateTime? @map("started_at")
  finishedAt    DateTime? @map("finished_at")
  errorMessage  String?   @map("error_message")
  createdBy     Int?      @map("created_by")

  destination      Destination       @relation(fields: [destinationId], references: [id], onDelete: Cascade)
  createdByUser    User?             @relation(fields: [createdBy], references: [id])
  scrapingHistories ScrapingHistory[]

  @@map("scraping_jobs")
}
```

#### Model: ScrapingHistory

```prisma
model ScrapingHistory {
  id            Int      @id @default(autoincrement())
  destinationId Int      @map("destination_id")
  jobId         Int      @map("job_id")
  totalReviews  Int?     @map("total_reviews")
  starsFilter   Json?    @map("stars_filter")
  hasText       Boolean? @map("has_text")
  sort          String?
  createdAt     DateTime @default(now()) @map("created_at")

  destination Destination @relation(fields: [destinationId], references: [id], onDelete: Cascade)
  job         ScrapingJob @relation(fields: [jobId], references: [id], onDelete: Cascade)

  @@map("scraping_history")
}
```

### 3. Custom Migration untuk pgvector

Buat migrasi manual:

```bash
npx prisma migrate dev --create-only --name init
```

Tambahkan di awal migration SQL:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Lalu jalankan:

```bash
npx prisma migrate dev
```

### 4. Buat Prisma Service & Module

Buat `src/prisma/prisma.service.ts` dan `src/prisma/prisma.module.ts` dengan global module pattern.

---

## Files yang Dibuat

```text
prisma/
├── schema.prisma              (new)
├── migrations/                (generated)

src/prisma/
├── prisma.module.ts           (new)
├── prisma.service.ts          (new)
```

---

## Acceptance Criteria

- [ ] `npx prisma migrate dev` sukses tanpa error
- [ ] `npx prisma generate` sukses
- [ ] pgvector extension aktif di PostgreSQL
- [ ] Semua 12 tabel terbuat di database
- [ ] PrismaService bisa di-inject ke module lain
- [ ] Relasi antar tabel benar (FK constraints)
