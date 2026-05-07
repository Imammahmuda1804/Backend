# Task 7.1 — Semantic Search Endpoint

> **Phase:** 7 - Semantic Search
> **Status:** ⬜ Belum Dimulai
> **Estimasi:** 2-3 jam
> **Dependencies:** Task 6.1, Task 6.2

---

## Objective

Implementasi semantic search utama: user mengetik query, backend mengirim ke FastAPI untuk embedding, lalu melakukan similarity search di pgvector.

---

## Endpoints

### POST /search

Semantic search utama (public, tapi login optional untuk save history).

Request:

```json
{
  "query": "wisata keluarga murah di bukittinggi"
}
```

Response (200):

```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "Jam Gadang",
      "slug": "jam-gadang",
      "city": "Bukittinggi",
      "province": "Sumatera Barat",
      "thumbnail_url": "...",
      "google_rating": 4.5,
      "user_rating": 4.2,
      "positive_ratio": 0.85,
      "recommendation_score": 0.78,
      "hybrid_score": 0.82,
      "distance": 0.15
    }
  ]
}
```

Logic:
1. Validate query (min 3 karakter)
2. POST query ke FastAPI `/embed` → get query embedding (384 dim)
3. Call `vectorService.hybridSearch(embedding, limit)`
4. (Optional) Simpan search query ke search_logs (jika user login)
5. Return ranked destinations

---

## Steps

### 1. Buat Search Module

```bash
nest g module modules/search
nest g controller modules/search
nest g service modules/search
```

### 2. Implementasi Search Service

```typescript
@Injectable()
export class SearchService {
  constructor(
    private nlpService: NlpService,
    private vectorService: VectorService,
    private prisma: PrismaService,
  ) {}

  async semanticSearch(query: string, userId?: number, limit = 10) {
    // 1. Get embedding dari FastAPI
    const embedding = await this.nlpService.embedQuery(query);

    // 2. Hybrid search di pgvector
    const results = await this.vectorService.hybridSearch(embedding, limit);

    // 3. Save search log (jika user login)
    if (userId) {
      await this.prisma.searchLog.create({
        data: { userId, keyword: query },
      });
    }

    return results;
  }
}
```

### 3. Buat Search Controller

- `@Post()` — `@Public()` (accessible tanpa login)
- Extract user ID dari JWT jika ada (optional auth)

### 4. Buat DTOs

- `search-query.dto.ts` — SearchQueryDto

---

## Files yang Dibuat

```text
src/modules/search/
├── search.module.ts       (new)
├── search.controller.ts   (new)
├── search.service.ts      (new)
├── dto/
│   └── search-query.dto.ts (new)
```

---

## Acceptance Criteria

- [ ] POST /search mengembalikan ranked destinations
- [ ] Ranking menggunakan hybrid formula (semantic 40% + sentiment 40% + rating 20%)
- [ ] Search bisa diakses tanpa login (public)
- [ ] Search menyimpan history jika user login
- [ ] Menolak query < 3 karakter (400)
- [ ] Mengembalikan max 50 results (limit cap)
- [ ] Handle error jika FastAPI tidak available (503)
