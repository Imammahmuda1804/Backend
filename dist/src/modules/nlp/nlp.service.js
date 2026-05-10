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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var NlpService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NlpService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
const form_data_1 = __importDefault(require("form-data"));
const nlp_unavailable_exception_1 = require("./exceptions/nlp-unavailable.exception");
const nlp_processing_exception_1 = require("./exceptions/nlp-processing.exception");
let NlpService = NlpService_1 = class NlpService {
    httpService;
    configService;
    logger = new common_1.Logger(NlpService_1.name);
    nlpBaseUrl;
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        this.nlpBaseUrl = this.configService.get('FASTAPI_URL', 'http://localhost:8000');
    }
    async processPipeline(csvBuffer, filename) {
        const formData = new form_data_1.default();
        formData.append('file', csvBuffer, { filename });
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService
                .post(`${this.nlpBaseUrl}/pipeline/process`, formData, {
                headers: formData.getHeaders(),
                timeout: 300000,
            })
                .pipe((0, rxjs_1.catchError)((error) => {
                this.handleAxiosError(error);
                throw error;
            })));
            this.logger.log(`✅ FastAPI response received. Keys: ${Object.keys(response.data).join(', ')}`);
            this.logger.log(`📊 Results count: ${response.data.results?.length || 'undefined'}`);
            this.logger.log(`📊 Topics count: ${response.data.topics?.length || 'undefined'}`);
            return response.data;
        }
        catch (error) {
            if (error instanceof nlp_unavailable_exception_1.NlpServiceUnavailableException ||
                error instanceof nlp_processing_exception_1.NlpProcessingException) {
                throw error;
            }
            const msg = error instanceof Error ? error.message : String(error);
            this.logger.error(`Unexpected error during NLP pipeline: ${msg}`);
            throw new nlp_processing_exception_1.NlpProcessingException('Unexpected error occurred during NLP processing');
        }
    }
    async embedQuery(text) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService
                .post(`${this.nlpBaseUrl}/embed`, { text }, { timeout: 30000 })
                .pipe((0, rxjs_1.catchError)((error) => {
                this.handleAxiosError(error);
                throw error;
            })));
            return response.data.embedding;
        }
        catch (error) {
            if (error instanceof nlp_unavailable_exception_1.NlpServiceUnavailableException ||
                error instanceof nlp_processing_exception_1.NlpProcessingException) {
                throw error;
            }
            const msg = error instanceof Error ? error.message : String(error);
            this.logger.error(`Unexpected error generating embedding: ${msg}`);
            throw new nlp_processing_exception_1.NlpProcessingException('Failed to generate embedding');
        }
    }
    async healthCheck() {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.nlpBaseUrl}/health`, { timeout: 5000 }));
            return response.status === 200;
        }
        catch (error) {
            this.logger.warn('FastAPI health check failed');
            return false;
        }
    }
    handleAxiosError(error) {
        if (error.code === 'ECONNREFUSED') {
            this.logger.error('Connection refused. Is FastAPI running?');
            throw new nlp_unavailable_exception_1.NlpServiceUnavailableException('NLP Service connection refused');
        }
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            this.logger.error('Request to FastAPI timed out');
            throw new nlp_unavailable_exception_1.NlpServiceUnavailableException('NLP Service request timed out');
        }
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;
            this.logger.error(`FastAPI returned status ${status}: ${JSON.stringify(data)}`);
            if (status === 422) {
                throw new nlp_processing_exception_1.NlpProcessingException('Invalid input format to NLP Service (422)');
            }
            if (status >= 500) {
                throw new nlp_processing_exception_1.NlpProcessingException('NLP Service internal error');
            }
        }
        this.logger.error(`FastAPI communication error: ${error.message}`);
        throw new nlp_processing_exception_1.NlpProcessingException('Error communicating with NLP Service');
    }
};
exports.NlpService = NlpService;
exports.NlpService = NlpService = NlpService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], NlpService);
//# sourceMappingURL=nlp.service.js.map