# Task 6.1 — NLP Integration Service (FastAPI Client)

> **Phase:** 6 - NLP & Vector
> **Status:** ⬜ Belum Dimulai
> **Estimasi:** 2-3 jam
> **Dependencies:** Task 1.1

---

## Objective

Membuat dedicated service untuk berkomunikasi dengan FastAPI NLP Service, termasuk error handling dan timeout management.

---

## FastAPI Endpoints yang Diakses

| Endpoint | Purpose | Method |
|---|---|---|
| `POST /pipeline/process` | Full NLP pipeline (sentiment + topic + embedding) | Multipart (CSV file) |
| `POST /embed` | Generate embedding untuk semantic search query | JSON body |

---

## Steps

### 1. Buat NLP Module

```bash
nest g module modules/nlp
nest g service modules/nlp
```

### 2. Implementasi NLP Service

```typescript
@Injectable()
export class NlpService {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  // Kirim CSV ke FastAPI untuk full NLP pipeline
  async processPipeline(csvBuffer: Buffer, filename: string): Promise<NlpPipelineResult> {
    const formData = new FormData();
    formData.append('file', csvBuffer, filename);

    const response = await firstValueFrom(
      this.httpService.post(
        `${this.nlpBaseUrl}/pipeline/process`,
        formData,
        { timeout: 300000 } // 5 minute timeout
      )
    );

    return response.data;
  }

  // Generate embedding untuk search query
  async embedQuery(text: string): Promise<number[]> {
    const response = await firstValueFrom(
      this.httpService.post(
        `${this.nlpBaseUrl}/embed`,
        { text },
        { timeout: 30000 } // 30 second timeout
      )
    );

    return response.data.embedding;
  }

  // Health check FastAPI
  async healthCheck(): Promise<boolean> { ... }
}
```

### 3. Error Handling

Handle error dari FastAPI:
- Connection refused → NLP service tidak running
- Timeout → Processing terlalu lama
- 422 → Invalid input format
- 500 → NLP internal error

Buat custom exceptions:
- `NlpServiceUnavailableException`
- `NlpProcessingException`

### 4. Buat Interfaces

```typescript
interface NlpPipelineResult {
  reviews: Array<{
    index: number;
    cleaned_text: string;
    sentiment: string;
    topic_id: number;
    topic_name: string;
    embedding: number[];
  }>;
  topics: Array<{
    id: number;
    name: string;
    keywords: string[];
  }>;
  destination_embedding: number[];
}
```

---

## Files yang Dibuat

```text
src/modules/nlp/
├── nlp.module.ts             (new)
├── nlp.service.ts            (new)
├── interfaces/
│   ├── nlp-pipeline-result.interface.ts  (new)
│   └── nlp-embed-result.interface.ts     (new)
├── exceptions/
│   ├── nlp-unavailable.exception.ts      (new)
│   └── nlp-processing.exception.ts       (new)
```

---

## Acceptance Criteria

- [ ] NLP Service bisa mengirim CSV ke FastAPI /pipeline/process
- [ ] NLP Service bisa mendapatkan embedding dari FastAPI /embed
- [ ] Timeout dikonfigurasi (5 menit untuk pipeline, 30 detik untuk embed)
- [ ] Error handling mengembalikan pesan yang jelas
- [ ] Health check bisa detect FastAPI status
- [ ] NLP Module bisa di-import oleh module lain
