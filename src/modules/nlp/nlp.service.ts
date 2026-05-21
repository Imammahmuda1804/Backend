import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, catchError } from 'rxjs';
import { AxiosError } from 'axios';
import FormData from 'form-data';
import { NlpPipelineResult } from './interfaces/nlp-pipeline-result.interface';
import { NlpServiceUnavailableException } from './exceptions/nlp-unavailable.exception';
import { NlpProcessingException } from './exceptions/nlp-processing.exception';

@Injectable()
// Menjadi client HTTP dari backend NestJS ke service FastAPI Model.
export class NlpService {
  private readonly logger = new Logger(NlpService.name);
  private readonly nlpBaseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.nlpBaseUrl = this.configService.get<string>(
      'FASTAPI_URL',
      'http://localhost:8000',
    );
  }

  async processPipeline(
    csvBuffer: Buffer,
    filename: string,
  ): Promise<NlpPipelineResult> {
    const formData = new FormData();
    formData.append('file', csvBuffer, { filename });

    try {
      const response = await firstValueFrom(
        this.httpService
          .post<NlpPipelineResult>(
            `${this.nlpBaseUrl}/pipeline/process`,
            formData,
            {
              headers: formData.getHeaders(),
              timeout: 300000, // 5 minutes timeout
            },
          )
          .pipe(
            catchError((error: AxiosError) => {
              this.handleAxiosError(error);
              throw error;
            }),
          ),
      );

      this.logger.log(
        `✅ FastAPI response received. Keys: ${Object.keys(response.data).join(', ')}`,
      );
      this.logger.log(
        `📊 Results count: ${response.data.results?.length || 'undefined'}`,
      );
      this.logger.log(
        `📊 Topics count: ${response.data.topics?.length || 'undefined'}`,
      );

      return response.data;
    } catch (error: unknown) {
      if (
        error instanceof NlpServiceUnavailableException ||
        error instanceof NlpProcessingException
      ) {
        throw error;
      }
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Unexpected error during NLP pipeline: ${msg}`);
      throw new NlpProcessingException(
        'Unexpected error occurred during NLP processing',
      );
    }
  }

  // Meminta embedding query ke FastAPI untuk semantic search.
  async embedQuery(text: string): Promise<number[]> {
    try {
      const response = await firstValueFrom(
        this.httpService
          .post<{ embedding: number[] }>(
            `${this.nlpBaseUrl}/embed`,
            { text },
            { timeout: 30000 }, // 30 seconds timeout
          )
          .pipe(
            catchError((error: AxiosError) => {
              this.handleAxiosError(error);
              throw error;
            }),
          ),
      );

      return response.data.embedding;
    } catch (error: unknown) {
      if (
        error instanceof NlpServiceUnavailableException ||
        error instanceof NlpProcessingException
      ) {
        throw error;
      }
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Unexpected error generating embedding: ${msg}`);
      throw new NlpProcessingException('Failed to generate embedding');
    }
  }

  // Mengecek kesehatan service FastAPI Model.
  async healthCheck(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.nlpBaseUrl}/health`, { timeout: 5000 }),
      );
      return response.status === 200;
    } catch {
      this.logger.warn('FastAPI health check failed');
      return false;
    }
  }

  // Mengubah error Axios menjadi exception backend yang terstruktur.
  private handleAxiosError(error: AxiosError): never {
    if (error.code === 'ECONNREFUSED') {
      this.logger.error('Connection refused. Is FastAPI running?');
      throw new NlpServiceUnavailableException(
        'NLP Service connection refused',
      );
    }

    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      this.logger.error('Request to FastAPI timed out');
      throw new NlpServiceUnavailableException('NLP Service request timed out');
    }

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      this.logger.error(
        `FastAPI returned status ${status}: ${JSON.stringify(data)}`,
      );

      if (status === 422) {
        throw new NlpProcessingException(
          'Invalid input format to NLP Service (422)',
        );
      }
      if (status === 429) {
        const headers = error.response.headers as Record<
          string,
          string | string[] | undefined
        >;
        const retryAfterHeader = headers['retry-after'];
        const retryAfter = Array.isArray(retryAfterHeader)
          ? retryAfterHeader[0]
          : retryAfterHeader;
        const retryMsg = retryAfter
          ? ` (Coba lagi dalam ${retryAfter} detik)`
          : '';
        throw new NlpServiceUnavailableException(
          `Terlalu banyak permintaan ke layanan AI (429)${retryMsg}`,
        );
      }
      if (status >= 500) {
        throw new NlpProcessingException('NLP Service internal error');
      }
    }

    this.logger.error(`FastAPI communication error: ${error.message}`);
    throw new NlpProcessingException('Error communicating with NLP Service');
  }
}
