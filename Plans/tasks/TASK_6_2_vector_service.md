# Task 6.2 — Vector Service (pgvector Operations)

> **Phase:** 6 - NLP & Vector
> **Status:** ⬜ Belum Dimulai
> **Estimasi:** 2-3 jam
> **Dependencies:** Task 1.2, Task 6.1

---

## Objective

Membuat dedicated VectorService untuk semua operasi pgvector karena Prisma tidak mendukung tipe `vector` secara native. Semua operasi menggunakan `prisma.$queryRaw`.

---

## Operations yang Dibutuhkan

| Operation | Digunakan Oleh |
|---|---|
| Insert destination embedding | NLP Pipeline Processor |
| Insert review embeddings (batch) | NLP Pipeline Processor |
| Similarity search destinations | Semantic Search |
| Update destination embedding | Analytics Recalculate |

---

## Steps

### 1. Buat Vector Service

```typescript
@Injectable()
export class VectorService {
  constructor(private prisma: PrismaService) {}

  /**
   * Insert/update embedding untuk destination
   */
  async upsertDestinationEmbedding(
    destinationId: number,
    embedding: number[],
  ): Promise<void> {
    const vectorStr = `[${embedding.join(',')}]`;
    await this.prisma.$executeRaw`
      UPDATE destinations
      SET embedding = ${vectorStr}::vector
      WHERE id = ${destinationId}
    `;
  }

  /**
   * Insert embedding untuk review
   */
  async insertReviewEmbedding(
    reviewId: number,
    embedding: number[],
  ): Promise<void> {
    const vectorStr = `[${embedding.join(',')}]`;
    await this.prisma.$executeRaw`
      INSERT INTO review_embeddings (review_id, embedding)
      VALUES (${reviewId}, ${vectorStr}::vector)
      ON CONFLICT (review_id)
      DO UPDATE SET embedding = ${vectorStr}::vector
    `;
  }

  /**
   * Batch insert review embeddings
   */
  async batchInsertReviewEmbeddings(
    items: Array<{ reviewId: number; embedding: number[] }>,
  ): Promise<void> {
    // Process in chunks of 100
    for (const chunk of chunkArray(items, 100)) {
      await Promise.all(
        chunk.map(item =>
          this.insertReviewEmbedding(item.reviewId, item.embedding),
        ),
      );
    }
  }

  /**
   * Similarity search pada destinations
   * Returns destinations sorted by cosine distance
   */
  async searchSimilarDestinations(
    queryEmbedding: number[],
    limit: number = 10,
  ): Promise<SimilarDestination[]> {
    const vectorStr = `[${queryEmbedding.join(',')}]`;
    return this.prisma.$queryRaw`
      SELECT
        id, name, slug, city, province,
        thumbnail_url, google_rating, user_rating,
        positive_ratio, recommendation_score,
        embedding <-> ${vectorStr}::vector AS distance
      FROM destinations
      WHERE embedding IS NOT NULL
        AND deleted_at IS NULL
      ORDER BY distance ASC
      LIMIT ${limit}
    `;
  }

  /**
   * Hybrid search: semantic + sentiment + rating
   */
  async hybridSearch(
    queryEmbedding: number[],
    limit: number = 10,
  ): Promise<SimilarDestination[]> {
    const vectorStr = `[${queryEmbedding.join(',')}]`;
    return this.prisma.$queryRaw`
      SELECT
        id, name, slug, city, province,
        thumbnail_url, google_rating, user_rating,
        positive_ratio, recommendation_score,
        (1 - (embedding <-> ${vectorStr}::vector)) * 0.4
        + COALESCE(positive_ratio, 0) * 0.4
        + COALESCE(user_rating, 0) / 5.0 * 0.2
        AS hybrid_score
      FROM destinations
      WHERE embedding IS NOT NULL
        AND deleted_at IS NULL
      ORDER BY hybrid_score DESC
      LIMIT ${limit}
    `;
  }
}
```

### 2. Buat Vector Module

Export VectorService sebagai provider yang bisa di-import module lain.

### 3. Buat Interfaces

```typescript
interface SimilarDestination {
  id: number;
  name: string;
  slug: string;
  city: string;
  province: string;
  thumbnail_url: string;
  google_rating: number;
  user_rating: number;
  positive_ratio: number;
  recommendation_score: number;
  distance?: number;
  hybrid_score?: number;
}
```

---

## Files yang Dibuat

```text
src/modules/nlp/
├── vector.service.ts                      (new)
├── interfaces/
│   └── similar-destination.interface.ts   (new)
```

Atau buat module terpisah:

```text
src/modules/vector/
├── vector.module.ts          (new)
├── vector.service.ts         (new)
├── interfaces/
│   └── similar-destination.interface.ts  (new)
```

---

## Acceptance Criteria

- [ ] upsertDestinationEmbedding berhasil menyimpan vector ke database
- [ ] insertReviewEmbedding berhasil menyimpan vector ke review_embeddings
- [ ] batchInsertReviewEmbeddings bisa handle ratusan embeddings
- [ ] searchSimilarDestinations mengembalikan hasil sorted by distance
- [ ] hybridSearch mengembalikan hasil sorted by hybrid score (semantic + sentiment + rating)
- [ ] Semua operasi menggunakan prisma.$queryRaw (bukan Prisma client biasa)
- [ ] Vector dimension 384 sesuai dengan MiniLM model
