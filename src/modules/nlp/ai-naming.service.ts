import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TopicGroupClassifierService } from './topic-group-classifier.service';
import type { TopicGroupCandidate } from './topic-group-classifier.service';
import { TopicNamePolicyService } from './topic-name-policy.service';

export type { TopicGroupCandidate } from './topic-group-classifier.service';

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

interface AiProviderError {
  message?: string;
  status?: number;
}

type TopicNameGenerationAttempt = {
  topicId: number;
  keywords: string[];
  prompt: string;
  modelName: string;
  attempt: number;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getProviderError(error: unknown): AiProviderError {
  if (!isObjectError(error)) return { message: String(error) };

  return {
    message: readStringProperty(error, 'message'),
    status: readNumberProperty(error, 'status'),
  };
}

function isObjectError(error: unknown): error is Record<string, unknown> {
  return typeof error === 'object' && error !== null;
}

function readStringProperty(source: Record<string, unknown>, property: string) {
  return typeof source[property] === 'string' ? source[property] : undefined;
}

function readNumberProperty(source: Record<string, unknown>, property: string) {
  return typeof source[property] === 'number' ? source[property] : undefined;
}

@Injectable()
// Menamai topic dengan Gemini dan memetakan topic ke topic group.
export class AiNamingService {
  private readonly logger = new Logger(AiNamingService.name);
  private genAI: GoogleGenerativeAI | null = null;
  private lastRequestTime = 0;
  private exhaustedModels = new Map<string, number>();

  constructor(
    private readonly topicNamePolicy: TopicNamePolicyService,
    private readonly groupClassifier: TopicGroupClassifierService,
  ) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY is not set. AI naming will be disabled.',
      );
      return;
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.logger.log(
      `Gemini AI initialized. Fallback chain: ${GEMINI_MODELS.join(' -> ')}`,
    );
  }

  async generateTopicName(
    topicId: number,
    keywords: string[],
    representativeDocs: string[] = [],
  ): Promise<string> {
    const fallback = this.topicNamePolicy.createFallbackName(topicId, keywords);

    if (!this.genAI) return fallback;

    const availableModels = this.getAvailableModels();
    if (availableModels.length === 0) {
      this.logger.error(
        `All Gemini models are cooling down. Using keyword fallback for topic ${topicId}.`,
      );
      return fallback;
    }

    const prompt = this.topicNamePolicy.buildPrompt(
      keywords,
      representativeDocs,
    );
    const topicName = await this.tryGenerateTopicName(
      topicId,
      keywords,
      prompt,
      availableModels,
    );

    if (topicName) return topicName;

    this.logger.error(
      `All Gemini models failed for topic ${topicId}. Using keyword fallback.`,
    );
    return fallback;
  }

  classifyTopicGroup(
    topicName: string,
    keywords: string[],
    representativeDocs: string[] = [],
    groups: TopicGroupCandidate[],
  ): number | null {
    return this.groupClassifier.classify(
      topicName,
      keywords,
      representativeDocs,
      groups,
    );
  }

  private async tryGenerateTopicName(
    topicId: number,
    keywords: string[],
    prompt: string,
    modelNames: string[],
  ): Promise<string | null> {
    for (const modelName of modelNames) {
      const topicName = await this.tryGenerateTopicNameWithModel(
        topicId,
        keywords,
        prompt,
        modelName,
      );

      if (topicName) return topicName;
    }

    return null;
  }

  private async tryGenerateTopicNameWithModel(
    topicId: number,
    keywords: string[],
    prompt: string,
    modelName: string,
  ): Promise<string | null> {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const topicName = await this.tryOneTopicNameGeneration({
        topicId,
        keywords,
        prompt,
        modelName,
        attempt,
      });

      if (topicName) return topicName;
      if (topicName === null) return null;
    }

    return null;
  }

  private async tryOneTopicNameGeneration(
    input: TopicNameGenerationAttempt,
  ): Promise<string | null | undefined> {
    try {
      await this.throttle();
      return await this.generateTopicNameFromModel(input);
    } catch (error) {
      const shouldRetry = await this.handleModelError(
        error,
        input.topicId,
        input.modelName,
        input.attempt,
      );

      return shouldRetry ? undefined : null;
    }
  }

  private async generateTopicNameFromModel(
    input: TopicNameGenerationAttempt,
  ): Promise<string | null> {
    const rawText = await this.requestTopicNameText(
      input.modelName,
      input.prompt,
    );
    const topicName = this.topicNamePolicy.extractValidName(
      rawText,
      input.keywords,
    );

    if (!topicName) {
      this.logger.warn(
        `Invalid AI topic name for topic ${input.topicId}: "${this.topicNamePolicy.sanitize(rawText)}". Trying next model.`,
      );
      return null;
    }

    this.logger.log(
      `Topic ${input.topicId} named by ${input.modelName}: "${topicName}"`,
    );
    return topicName;
  }

  private async requestTopicNameText(modelName: string, prompt: string) {
    const model = this.genAI?.getGenerativeModel({ model: modelName });
    const result = await model?.generateContent(prompt);
    return result?.response.text() ?? '';
  }

  private async handleModelError(
    error: unknown,
    topicId: number,
    modelName: string,
    attempt: number,
  ): Promise<boolean> {
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

  private isRateLimitError(
    providerError: AiProviderError,
    errorMessage: string,
  ) {
    return providerError.status === 429 || errorMessage.includes('429');
  }

  private warnModelFailure(
    modelName: string,
    topicId: number,
    errorMessage: string,
  ) {
    this.logger.warn(
      `${modelName} failed for topic ${topicId}: ${errorMessage}`,
    );
  }

  private handleDailyQuotaExhaustion(
    error: unknown,
    modelName: string,
    topicId: number,
  ) {
    if (!this.isDailyQuotaExhausted(error)) return false;

    this.exhaustedModels.set(modelName, Date.now());
    this.logger.warn(
      `${modelName} daily quota exhausted for topic ${topicId}. Moving to next model.`,
    );
    return true;
  }

  private warnRetryLimitReached(modelName: string, topicId: number) {
    this.logger.warn(
      `${modelName} retry limit reached for topic ${topicId}. Moving to next model.`,
    );
  }

  private async waitBeforeRetry(modelName: string, topicId: number) {
    this.logger.warn(
      `Rate limited on ${modelName} for topic ${topicId}. Retrying in ${RETRY_DELAY_MS / 1000}s.`,
    );
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
  }

  private isModelExhausted(modelName: string): boolean {
    const blockedAt = this.exhaustedModels.get(modelName);
    if (!blockedAt) return false;

    const elapsed = Date.now() - blockedAt;
    if (elapsed < DAILY_QUOTA_COOLDOWN_MS) return true;

    this.exhaustedModels.delete(modelName);
    this.logger.log(`${modelName} cooldown finished, model can be retried.`);
    return false;
  }

  private isDailyQuotaExhausted(error: unknown): boolean {
    const message = getErrorMessage(error);
    return message.includes('PerDay') || message.includes('limit: 0');
  }

  private async throttle(): Promise<void> {
    const elapsed = Date.now() - this.lastRequestTime;
    if (elapsed < DELAY_BETWEEN_REQUESTS_MS) {
      await new Promise((resolve) =>
        setTimeout(resolve, DELAY_BETWEEN_REQUESTS_MS - elapsed),
      );
    }
    this.lastRequestTime = Date.now();
  }

  private getAvailableModels(): string[] {
    return GEMINI_MODELS.filter((model) => !this.isModelExhausted(model));
  }
}
