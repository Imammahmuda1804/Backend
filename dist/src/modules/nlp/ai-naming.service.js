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
const topic_group_classifier_service_1 = require("./topic-group-classifier.service");
const topic_name_policy_service_1 = require("./topic-name-policy.service");
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
    if (!isObjectError(error))
        return { message: String(error) };
    return {
        message: readStringProperty(error, 'message'),
        status: readNumberProperty(error, 'status'),
    };
}
function isObjectError(error) {
    return typeof error === 'object' && error !== null;
}
function readStringProperty(source, property) {
    return typeof source[property] === 'string' ? source[property] : undefined;
}
function readNumberProperty(source, property) {
    return typeof source[property] === 'number' ? source[property] : undefined;
}
let AiNamingService = AiNamingService_1 = class AiNamingService {
    topicNamePolicy;
    groupClassifier;
    logger = new common_1.Logger(AiNamingService_1.name);
    genAI = null;
    lastRequestTime = 0;
    exhaustedModels = new Map();
    constructor(topicNamePolicy, groupClassifier) {
        this.topicNamePolicy = topicNamePolicy;
        this.groupClassifier = groupClassifier;
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            this.logger.warn('GEMINI_API_KEY is not set. AI naming will be disabled.');
            return;
        }
        this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        this.logger.log(`Gemini AI initialized. Fallback chain: ${GEMINI_MODELS.join(' -> ')}`);
    }
    async generateTopicName(topicId, keywords, representativeDocs = []) {
        const fallback = this.topicNamePolicy.createFallbackName(topicId, keywords);
        if (!this.genAI)
            return fallback;
        const availableModels = this.getAvailableModels();
        if (availableModels.length === 0) {
            this.logger.error(`All Gemini models are cooling down. Using keyword fallback for topic ${topicId}.`);
            return fallback;
        }
        const prompt = this.topicNamePolicy.buildPrompt(keywords, representativeDocs);
        const topicName = await this.tryGenerateTopicName(topicId, keywords, prompt, availableModels);
        if (topicName)
            return topicName;
        this.logger.error(`All Gemini models failed for topic ${topicId}. Using keyword fallback.`);
        return fallback;
    }
    classifyTopicGroup(topicName, keywords, representativeDocs = [], groups) {
        return this.groupClassifier.classify(topicName, keywords, representativeDocs, groups);
    }
    async tryGenerateTopicName(topicId, keywords, prompt, modelNames) {
        for (const modelName of modelNames) {
            const topicName = await this.tryGenerateTopicNameWithModel(topicId, keywords, prompt, modelName);
            if (topicName)
                return topicName;
        }
        return null;
    }
    async tryGenerateTopicNameWithModel(topicId, keywords, prompt, modelName) {
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            const topicName = await this.tryOneTopicNameGeneration({
                topicId,
                keywords,
                prompt,
                modelName,
                attempt,
            });
            if (topicName)
                return topicName;
            if (topicName === null)
                return null;
        }
        return null;
    }
    async tryOneTopicNameGeneration(input) {
        try {
            await this.throttle();
            return await this.generateTopicNameFromModel(input);
        }
        catch (error) {
            const shouldRetry = await this.handleModelError(error, input.topicId, input.modelName, input.attempt);
            return shouldRetry ? undefined : null;
        }
    }
    async generateTopicNameFromModel(input) {
        const rawText = await this.requestTopicNameText(input.modelName, input.prompt);
        const topicName = this.topicNamePolicy.extractValidName(rawText, input.keywords);
        if (!topicName) {
            this.logger.warn(`Invalid AI topic name for topic ${input.topicId}: "${this.topicNamePolicy.sanitize(rawText)}". Trying next model.`);
            return null;
        }
        this.logger.log(`Topic ${input.topicId} named by ${input.modelName}: "${topicName}"`);
        return topicName;
    }
    async requestTopicNameText(modelName, prompt) {
        const model = this.genAI?.getGenerativeModel({ model: modelName });
        const result = await model?.generateContent(prompt);
        return result?.response.text() ?? '';
    }
    async handleModelError(error, topicId, modelName, attempt) {
        const providerError = getProviderError(error);
        const errorMessage = getErrorMessage(error);
        const isRateLimit = this.isRateLimitError(providerError, errorMessage);
        if (!isRateLimit) {
            this.warnModelFailure(modelName, topicId, errorMessage);
            return false;
        }
        if (this.handleDailyQuotaExhaustion(error, modelName, topicId)) {
            return false;
        }
        if (attempt >= MAX_RETRIES) {
            this.warnRetryLimitReached(modelName, topicId);
            return false;
        }
        await this.waitBeforeRetry(modelName, topicId);
        return true;
    }
    isRateLimitError(providerError, errorMessage) {
        return providerError.status === 429 || errorMessage.includes('429');
    }
    warnModelFailure(modelName, topicId, errorMessage) {
        this.logger.warn(`${modelName} failed for topic ${topicId}: ${errorMessage}`);
    }
    handleDailyQuotaExhaustion(error, modelName, topicId) {
        if (!this.isDailyQuotaExhausted(error))
            return false;
        this.exhaustedModels.set(modelName, Date.now());
        this.logger.warn(`${modelName} daily quota exhausted for topic ${topicId}. Moving to next model.`);
        return true;
    }
    warnRetryLimitReached(modelName, topicId) {
        this.logger.warn(`${modelName} retry limit reached for topic ${topicId}. Moving to next model.`);
    }
    async waitBeforeRetry(modelName, topicId) {
        this.logger.warn(`Rate limited on ${modelName} for topic ${topicId}. Retrying in ${RETRY_DELAY_MS / 1000}s.`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
    isModelExhausted(modelName) {
        const blockedAt = this.exhaustedModels.get(modelName);
        if (!blockedAt)
            return false;
        const elapsed = Date.now() - blockedAt;
        if (elapsed < DAILY_QUOTA_COOLDOWN_MS)
            return true;
        this.exhaustedModels.delete(modelName);
        this.logger.log(`${modelName} cooldown finished, model can be retried.`);
        return false;
    }
    isDailyQuotaExhausted(error) {
        const message = getErrorMessage(error);
        return message.includes('PerDay') || message.includes('limit: 0');
    }
    async throttle() {
        const elapsed = Date.now() - this.lastRequestTime;
        if (elapsed < DELAY_BETWEEN_REQUESTS_MS) {
            await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_REQUESTS_MS - elapsed));
        }
        this.lastRequestTime = Date.now();
    }
    getAvailableModels() {
        return GEMINI_MODELS.filter((model) => !this.isModelExhausted(model));
    }
};
exports.AiNamingService = AiNamingService;
exports.AiNamingService = AiNamingService = AiNamingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [topic_name_policy_service_1.TopicNamePolicyService,
        topic_group_classifier_service_1.TopicGroupClassifierService])
], AiNamingService);
//# sourceMappingURL=ai-naming.service.js.map