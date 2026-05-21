"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AiNamingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiNamingService = void 0;
const common_1 = require("@nestjs/common");
const generative_ai_1 = require("@google/generative-ai");
const GEMINI_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-3-flash-preview',
    'gemini-3.1-flash-lite',
];
const DELAY_BETWEEN_REQUESTS_MS = 4000;
const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 15000;
const DAILY_QUOTA_COOLDOWN_MS = 60 * 60 * 1000;
function getErrorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
function getProviderError(error) {
    if (typeof error === 'object' && error !== null) {
        const message = 'message' in error && typeof error.message === 'string'
            ? error.message
            : undefined;
        const status = 'status' in error && typeof error.status === 'number'
            ? error.status
            : undefined;
        return { message, status };
    }
    return { message: String(error) };
}
let AiNamingService = AiNamingService_1 = class AiNamingService {
    logger = new common_1.Logger(AiNamingService_1.name);
    genAI = null;
    lastRequestTime = 0;
    exhaustedModels = new Map();
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
            this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
            this.logger.log(`Gemini AI initialized. Fallback chain: ${GEMINI_MODELS.join(' → ')}`);
        }
        else {
            this.logger.warn('GEMINI_API_KEY is not set. AI naming will be disabled.');
        }
    }
    isModelExhausted(modelName) {
        const blockedAt = this.exhaustedModels.get(modelName);
        if (!blockedAt)
            return false;
        const elapsed = Date.now() - blockedAt;
        if (elapsed >= DAILY_QUOTA_COOLDOWN_MS) {
            this.exhaustedModels.delete(modelName);
            this.logger.log(`♻️ ${modelName} cooldown selesai, bisa dicoba lagi.`);
            return false;
        }
        return true;
    }
    isDailyQuotaExhausted(error) {
        const msg = getErrorMessage(error);
        return msg.includes('PerDay') || msg.includes('limit: 0');
    }
    async throttle() {
        const now = Date.now();
        const elapsed = now - this.lastRequestTime;
        if (elapsed < DELAY_BETWEEN_REQUESTS_MS) {
            const waitMs = DELAY_BETWEEN_REQUESTS_MS - elapsed;
            await new Promise((resolve) => setTimeout(resolve, waitMs));
        }
        this.lastRequestTime = Date.now();
    }
    getAvailableModels() {
        return GEMINI_MODELS.filter((m) => !this.isModelExhausted(m));
    }
    fallbackTopicName(topicId, keywords) {
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
    sanitizeTopicName(value) {
        return value
            .replace(/^["'`]|["'`]$/g, '')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/^\d+[).\-\s]+/, '')
            .replace(/\s+/g, ' ')
            .replace(/[.,;:]+$/g, '')
            .trim();
    }
    extractValidTopicName(value, keywords) {
        const sanitized = this.sanitizeTopicName(value);
        if (this.isValidTopicName(sanitized, keywords))
            return sanitized;
        const separatedCandidates = value
            .split(/[\n\r,;|/]+/)
            .map((candidate) => this.sanitizeTopicName(candidate))
            .filter(Boolean);
        for (const candidate of separatedCandidates) {
            if (this.isValidTopicName(candidate, keywords))
                return candidate;
        }
        const words = sanitized.split(/\s+/).filter(Boolean);
        for (let size = 2; size <= 3; size++) {
            for (let index = 0; index <= words.length - size; index++) {
                const candidate = words.slice(index, index + size).join(' ');
                if (this.isValidTopicName(candidate, keywords))
                    return candidate;
            }
        }
        return null;
    }
    isValidTopicName(value, keywords) {
        const name = this.sanitizeTopicName(value);
        if (!name || name.length > 28)
            return false;
        if (name.split(/\s+/).length > 3)
            return false;
        if (/topic\s*\d+/i.test(name))
            return false;
        if (/[|/\\]|\n|\r/.test(name))
            return false;
        if ((name.match(/dan/gi) || []).length > 1)
            return false;
        const normalizedName = name.toLowerCase();
        const keywordSet = new Set(keywords.map((keyword) => keyword.toLowerCase()));
        if (keywordSet.has(normalizedName) && keywords.length > 1)
            return false;
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
    async generateTopicName(topicId, keywords, representativeDocs = []) {
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
            this.logger.error(`❌ Semua ${GEMINI_MODELS.length} model Gemini sedang dalam cooldown. ` +
                `Menggunakan nama keyword-based untuk topic ${topicId}.`);
            return fallback;
        }
        for (const modelName of availableModels) {
            for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
                try {
                    await this.throttle();
                    const model = this.genAI.getGenerativeModel({ model: modelName });
                    const result = await model.generateContent(prompt);
                    const response = result.response;
                    const rawText = response.text();
                    const text = this.extractValidTopicName(rawText, keywords);
                    if (!text) {
                        this.logger.warn(`Invalid AI topic name for topic ${topicId}: "${this.sanitizeTopicName(rawText)}". Trying fallback chain.`);
                        break;
                    }
                    this.logger.log(`✅ Topic ${topicId} named by ${modelName}: "${text}"`);
                    return text;
                }
                catch (error) {
                    const providerError = getProviderError(error);
                    const errorMessage = getErrorMessage(error);
                    const isRateLimit = providerError.status === 429 || errorMessage.includes('429');
                    if (isRateLimit) {
                        if (this.isDailyQuotaExhausted(error)) {
                            this.exhaustedModels.set(modelName, Date.now());
                            const remaining = this.getAvailableModels().length;
                            this.logger.warn(`🚫 ${modelName} daily quota habis untuk topic ${topicId}. ` +
                                `Cooldown 1 jam. Sisa model tersedia: ${remaining}/${GEMINI_MODELS.length}`);
                            break;
                        }
                        if (attempt < MAX_RETRIES) {
                            this.logger.warn(`⏳ Rate limited on ${modelName} for topic ${topicId}. ` +
                                `Retrying in ${RETRY_DELAY_MS / 1000}s (attempt ${attempt + 1}/${MAX_RETRIES})...`);
                            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
                            continue;
                        }
                        this.logger.warn(`⚠️ ${modelName} retry habis untuk topic ${topicId}. Pindah ke model berikutnya.`);
                        break;
                    }
                    this.logger.warn(`⚠️ ${modelName} failed for topic ${topicId}: ${errorMessage}`);
                    break;
                }
            }
        }
        this.logger.error(`❌ All Gemini models failed for topic ${topicId}. Using keyword-based name.`);
        return fallback;
    }
    classifyTopicGroup(topicName, keywords, representativeDocs = [], groups) {
        if (groups.length === 0)
            return null;
        const corpus = [topicName, ...keywords, ...representativeDocs]
            .join(' ')
            .toLowerCase();
        let bestGroup = null;
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
        if (bestGroup && bestScore > 0)
            return bestGroup.id;
        const fallback = groups.find((group) => group.groupName.toLowerCase().includes('lain'));
        return fallback?.id ?? groups[groups.length - 1]?.id ?? null;
    }
};
exports.AiNamingService = AiNamingService;
exports.AiNamingService = AiNamingService = AiNamingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AiNamingService);
//# sourceMappingURL=ai-naming.service.js.map