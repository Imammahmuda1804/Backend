export interface TopicGroupCandidate {
    id: number;
    groupName: string;
    keywords: string[];
}
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
    private fallbackTopicName;
    private sanitizeTopicName;
    private extractValidTopicName;
    private isValidTopicName;
    generateTopicName(topicId: number, keywords: string[], representativeDocs?: string[]): Promise<string>;
    classifyTopicGroup(topicName: string, keywords: string[], representativeDocs: string[] | undefined, groups: TopicGroupCandidate[]): number | null;
}
