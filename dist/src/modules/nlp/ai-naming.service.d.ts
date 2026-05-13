export declare class AiNamingService {
    private readonly logger;
    private genAI;
    private lastRequestTime;
    private exhaustedModels;
    constructor();
    private isModelExhausted;
    private isDailyQuotaExhausted;
    private throttle;
    private getAvailableModels;
    generateTopicName(topicId: number, keywords: string[]): Promise<string>;
}
