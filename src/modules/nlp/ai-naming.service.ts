import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Daftar SEMUA model Gemini gratis yang akan dicoba secara berurutan (fallback chain).
 * Jika model pertama gagal (quota habis / tidak tersedia), otomatis pindah ke model berikutnya.
 * Urutan: model terbaru & tercepat duluan, lalu fallback ke model lama.
 */
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite',
];

/** Delay antar request API (ms) — mencegah rate limit pada free tier */
const DELAY_BETWEEN_REQUESTS_MS = 4000; // 4 detik = maks 15 request/menit

/** Jumlah retry jika kena rate limit per-menit (429) */
const MAX_RETRIES = 1;

/** Delay sebelum retry saat kena rate limit per-menit */
const RETRY_DELAY_MS = 15000; // 15 detik

/** Durasi cooldown saat daily quota habis (1 jam) — model akan di-skip selama ini */
const DAILY_QUOTA_COOLDOWN_MS = 60 * 60 * 1000;

interface AiProviderError {
  message?: string;
  status?: number;
}

export interface TopicGroupCandidate {
  id: number;
  groupName: string;
  keywords: string[];
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getProviderError(error: unknown): AiProviderError {
  if (typeof error === 'object' && error !== null) {
    const message =
      'message' in error && typeof error.message === 'string'
        ? error.message
        : undefined;
    const status =
      'status' in error && typeof error.status === 'number'
        ? error.status
        : undefined;
    return { message, status };
  }
  return { message: String(error) };
}

@Injectable()
export class AiNamingService {
  private readonly logger = new Logger(AiNamingService.name);
  private genAI: GoogleGenerativeAI | null = null;
  private lastRequestTime = 0;

  /**
   * Track model yang daily quota-nya sudah habis.
   * Key = model name, Value = timestamp kapan di-block.
   * Setelah DAILY_QUOTA_COOLDOWN_MS, model bisa dicoba lagi.
   */
  private exhaustedModels = new Map<string, number>();

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.logger.log(
        `Gemini AI initialized. Fallback chain: ${GEMINI_MODELS.join(' → ')}`,
      );
    } else {
      this.logger.warn(
        'GEMINI_API_KEY is not set. AI naming will be disabled.',
      );
    }
  }

  /**
   * Cek apakah model masih dalam cooldown karena daily quota habis.
   */
  private isModelExhausted(modelName: string): boolean {
    const blockedAt = this.exhaustedModels.get(modelName);
    if (!blockedAt) return false;

    const elapsed = Date.now() - blockedAt;
    if (elapsed >= DAILY_QUOTA_COOLDOWN_MS) {
      // Cooldown selesai, bisa dicoba lagi
      this.exhaustedModels.delete(modelName);
      this.logger.log(`♻️ ${modelName} cooldown selesai, bisa dicoba lagi.`);
      return false;
    }

    return true;
  }

  /**
   * Deteksi apakah error 429 disebabkan oleh daily quota (bukan per-menit).
   * Daily quota error biasanya mengandung kata "PerDay" atau "limit: 0".
   */
  private isDailyQuotaExhausted(error: unknown): boolean {
    const msg = getErrorMessage(error);
    return msg.includes('PerDay') || msg.includes('limit: 0');
  }

  /**
   * Menunggu agar tidak mengirim request terlalu cepat (rate limiting).
   */
  private async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < DELAY_BETWEEN_REQUESTS_MS) {
      const waitMs = DELAY_BETWEEN_REQUESTS_MS - elapsed;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Mendapatkan daftar model yang masih available (belum exhausted).
   */
  private getAvailableModels(): string[] {
    return GEMINI_MODELS.filter((m) => !this.isModelExhausted(m));
  }

  private fallbackTopicName(topicId: number, keywords: string[]): string {
    const usableKeywords = keywords
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword.length > 0)
      .slice(0, 2);

    return usableKeywords.length > 0
      ? usableKeywords
          .map((keyword) => keyword.charAt(0).toUpperCase() + keyword.slice(1))
          .join(' ')
      : `Topic ${topicId}`;
  }

  private sanitizeTopicName(value: string): string {
    return value
      .replace(/^["'`]|["'`]$/g, '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/^\d+[).\-\s]+/, '')
      .replace(/\s+/g, ' ')
      .replace(/[.,;:]+$/g, '')
      .trim();
  }

  private extractValidTopicName(
    value: string,
    keywords: string[],
  ): string | null {
    const sanitized = this.sanitizeTopicName(value);
    if (this.isValidTopicName(sanitized, keywords)) return sanitized;

    const separatedCandidates = value
      .split(/[\n\r,;|/]+/)
      .map((candidate) => this.sanitizeTopicName(candidate))
      .filter(Boolean);

    for (const candidate of separatedCandidates) {
      if (this.isValidTopicName(candidate, keywords)) return candidate;
    }

    const words = sanitized.split(/\s+/).filter(Boolean);
    for (let size = 2; size <= 3; size++) {
      for (let index = 0; index <= words.length - size; index++) {
        const candidate = words.slice(index, index + size).join(' ');
        if (this.isValidTopicName(candidate, keywords)) return candidate;
      }
    }

    return null;
  }

  private isValidTopicName(value: string, keywords: string[]): boolean {
    const name = this.sanitizeTopicName(value);
    if (!name || name.length > 28) return false;
    if (name.split(/\s+/).length > 3) return false;
    if (/topic\s*\d+/i.test(name)) return false;
    if (/[|/\\]|\n|\r/.test(name)) return false;
    if ((name.match(/dan/gi) || []).length > 1) return false;

    const normalizedName = name.toLowerCase();
    const keywordSet = new Set(
      keywords.map((keyword) => keyword.toLowerCase()),
    );
    if (keywordSet.has(normalizedName) && keywords.length > 1) return false;

    const genericNames = new Set([
      'wisata',
      'tempat wisata',
      'pengalaman wisata',
      'destinasi',
      'ulasan',
      'perjalanan',
    ]);
    return !genericNames.has(normalizedName);
  }

  async generateTopicName(
    topicId: number,
    keywords: string[],
    representativeDocs: string[] = [],
  ): Promise<string> {
    const fallback = this.fallbackTopicName(topicId, keywords);

    if (!this.genAI) {
      return fallback;
    }

    const exampleReviews = representativeDocs.length
      ? `\nContoh ulasan:\n${representativeDocs
          .slice(0, 3)
          .map((doc) => `- ${doc}`)
          .join('\n')}\n`
      : '';

    const prompt = `Tugas Anda adalah memberi LABEL KATEGORI untuk filter ulasan pariwisata berdasarkan kumpulan kata kunci dan contoh ulasan berikut:
[ ${keywords.join(', ')} ]
${exampleReviews}

Aturan ketat:
1. Bahasa Indonesia, ramah untuk user, dan cocok sebagai label UI.
2. Maksimal 3 kata dan maksimal 28 karakter.
3. Label harus spesifik dan langsung, contoh: Tiket mahal, Akses susah, Toilet kotor, Spot foto bagus.
4. Gunakan contoh ulasan untuk memahami konteks, jangan hanya menyalin keyword mentah.
5. JANGAN gabungkan beberapa label menjadi satu.
6. JANGAN gunakan awalan seperti "Tentang", "Keluhan", "Masalah", atau "Kondisi".
7. Outputkan nama label saja, tanpa tanda kutip, titik, atau penjelasan.`;

    const availableModels = this.getAvailableModels();

    if (availableModels.length === 0) {
      this.logger.error(
        `❌ Semua ${GEMINI_MODELS.length} model Gemini sedang dalam cooldown. ` +
          `Menggunakan nama keyword-based untuk topic ${topicId}.`,
      );
      return fallback;
    }

    // Coba setiap model yang masih available secara berurutan
    for (const modelName of availableModels) {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          // Throttle: pastikan ada jeda antar request
          await this.throttle();

          const model = this.genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          const response = result.response;
          const rawText = response.text();
          const text = this.extractValidTopicName(rawText, keywords);

          if (!text) {
            this.logger.warn(
              `Invalid AI topic name for topic ${topicId}: "${this.sanitizeTopicName(rawText)}". Trying fallback chain.`,
            );
            break;
          }

          this.logger.log(
            `✅ Topic ${topicId} named by ${modelName}: "${text}"`,
          );
          return text;
        } catch (error) {
          const providerError = getProviderError(error);
          const errorMessage = getErrorMessage(error);
          const isRateLimit =
            providerError.status === 429 || errorMessage.includes('429');

          if (isRateLimit) {
            if (this.isDailyQuotaExhausted(error)) {
              // Daily quota habis — langsung skip ke model berikutnya
              this.exhaustedModels.set(modelName, Date.now());
              const remaining = this.getAvailableModels().length;
              this.logger.warn(
                `🚫 ${modelName} daily quota habis untuk topic ${topicId}. ` +
                  `Cooldown 1 jam. Sisa model tersedia: ${remaining}/${GEMINI_MODELS.length}`,
              );
              break; // keluar dari retry loop, lanjut ke model berikutnya
            }

            if (attempt < MAX_RETRIES) {
              // Per-minute rate limit — tunggu lalu retry
              this.logger.warn(
                `⏳ Rate limited on ${modelName} for topic ${topicId}. ` +
                  `Retrying in ${RETRY_DELAY_MS / 1000}s (attempt ${attempt + 1}/${MAX_RETRIES})...`,
              );
              await new Promise((resolve) =>
                setTimeout(resolve, RETRY_DELAY_MS),
              );
              continue;
            }

            // Retry habis tapi bukan daily — skip ke model berikutnya
            this.logger.warn(
              `⚠️ ${modelName} retry habis untuk topic ${topicId}. Pindah ke model berikutnya.`,
            );
            break;
          }

          // Error non-429 (misalnya model tidak tersedia, network error)
          this.logger.warn(
            `⚠️ ${modelName} failed for topic ${topicId}: ${errorMessage}`,
          );
          break;
        }
      }
    }

    // Semua model gagal — gunakan fallback manual
    this.logger.error(
      `❌ All Gemini models failed for topic ${topicId}. Using keyword-based name.`,
    );
    return fallback;
  }

  classifyTopicGroup(
    topicName: string,
    keywords: string[],
    representativeDocs: string[] = [],
    groups: TopicGroupCandidate[],
  ): number | null {
    if (groups.length === 0) return null;

    const corpus = [topicName, ...keywords, ...representativeDocs]
      .join(' ')
      .toLowerCase();

    let bestGroup: TopicGroupCandidate | null = null;
    let bestScore = -1;

    for (const group of groups) {
      const score = group.keywords.reduce((total, keyword) => {
        const normalized = keyword.toLowerCase();
        return corpus.includes(normalized) ? total + 1 : total;
      }, 0);

      if (score > bestScore) {
        bestScore = score;
        bestGroup = group;
      }
    }

    if (bestGroup && bestScore > 0) return bestGroup.id;

    const fallback = groups.find((group) =>
      group.groupName.toLowerCase().includes('lain'),
    );

    return fallback?.id ?? groups[groups.length - 1]?.id ?? null;
  }
}
