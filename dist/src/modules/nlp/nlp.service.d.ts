import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { NlpPipelineResult } from './interfaces/nlp-pipeline-result.interface';
export declare class NlpService {
    private readonly httpService;
    private readonly configService;
    private readonly logger;
    private readonly nlpBaseUrl;
    constructor(httpService: HttpService, configService: ConfigService);
    processPipeline(csvBuffer: Buffer, filename: string): Promise<NlpPipelineResult>;
    embedQuery(text: string): Promise<number[]>;
    healthCheck(): Promise<boolean>;
    private requestFastApi;
    private handleAxiosError;
    private handleResponseError;
    private getRetryMessage;
}
