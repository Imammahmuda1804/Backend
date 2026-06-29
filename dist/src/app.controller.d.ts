import { NlpService } from './modules/nlp/nlp.service';
export declare class AppController {
    private readonly nlpService;
    constructor(nlpService: NlpService);
    getHello(): string;
    testNlp(): Promise<{
        status: string;
        fastapi_healthy: boolean;
        message: string;
    } | {
        status: string;
        message: string;
        fastapi_healthy?: undefined;
    }>;
}
