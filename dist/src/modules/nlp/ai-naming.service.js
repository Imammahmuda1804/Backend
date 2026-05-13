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
        const msg = error?.message || String(error);
        return msg.includes('PerDay') || msg.includes('limit: 0');
    }
    async throttle() {
        const now = Date.now();
        const elapsed = now - this.lastRequestTime;
        if (elapsed < DELAY_BETWEEN_REQUESTS_MS) {
            const waitMs = DELAY_BETWEEN_REQUESTS_MS - elapsed;
            await new Promise(resolve => setTimeout(resolve, waitMs));
        }
        this.lastRequestTime = Date.now();
    }
    getAvailableModels() {
        return GEMINI_MODELS.filter(m => !this.isModelExhausted(m));
    }
    async generateTopicName(topicId, keywords) {
        if (!this.genAI) {
            return `Topic ${topicId}: ${keywords.slice(0, 3).join(', ')}`;
        }
        const prompt = `Anda adalah asisten AI untuk analisis data pariwisata.
Tugas Anda adalah membuat NAMA TOPIK yang singkat, jelas, dan informatif (maksimal 5 kata) berdasarkan daftar kata kunci berikut.
Kata kunci: ${keywords.join(', ')}

Hanya kembalikan nama topiknya saja, tanpa penjelasan apapun, tanpa tanda kutip. Contoh output: Keluhan Harga Tiket, Fasilitas Kamar Mandi, Pemandangan Alam Indah.`;
        const availableModels = this.getAvailableModels();
        if (availableModels.length === 0) {
            this.logger.error(`❌ Semua ${GEMINI_MODELS.length} model Gemini sedang dalam cooldown. ` +
                `Menggunakan nama keyword-based untuk topic ${topicId}.`);
            return `Topic ${topicId}: ${keywords.slice(0, 3).join(', ')}`;
        }
        for (const modelName of availableModels) {
            for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
                try {
                    await this.throttle();
                    const model = this.genAI.getGenerativeModel({ model: modelName });
                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    let text = response.text().trim();
                    text = text.replace(/^["']|["']$/g, '');
                    this.logger.log(`✅ Topic ${topicId} named by ${modelName}: "${text}"`);
                    return text;
                }
                catch (error) {
                    const isRateLimit = error?.status === 429 ||
                        (error?.message && error.message.includes('429'));
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
                            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                            continue;
                        }
                        this.logger.warn(`⚠️ ${modelName} retry habis untuk topic ${topicId}. Pindah ke model berikutnya.`);
                        break;
                    }
                    this.logger.warn(`⚠️ ${modelName} failed for topic ${topicId}: ${error.message || error}`);
                    break;
                }
            }
        }
        this.logger.error(`❌ All Gemini models failed for topic ${topicId}. Using keyword-based name.`);
        return `Topic ${topicId}: ${keywords.slice(0, 3).join(', ')}`;
    }
};
exports.AiNamingService = AiNamingService;
exports.AiNamingService = AiNamingService = AiNamingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AiNamingService);
//# sourceMappingURL=ai-naming.service.js.map