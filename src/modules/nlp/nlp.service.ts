import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom, Observable } from 'rxjs';
import { AxiosError, AxiosResponse } from 'axios';
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

    const data = await this.requestFastApi(
      () =>
        this.httpService.post<NlpPipelineResult>(
          `${this.nlpBaseUrl}/pipeline/process`,
          formData,
          {
            headers: formData.getHeaders(),
            timeout: 300000,
          },
        ),
      'NLP pipeline',
      'Unexpected error occurred during NLP processing',
    );

    this.logger.log(
      `FastAPI response received. Keys: ${Object.keys(data).join(', ')}`,
    );
    this.logger.log(`Results count: ${data.results?.length || 'undefined'}`);
    this.logger.log(`Topics count: ${data.topics?.length || 'undefined'}`);

    return data;
  }

  // Meminta embedding query ke FastAPI untuk semantic search.
  async embedQuery(text: string): Promise<number[]> {
    const data = await this.requestFastApi(
      () =>
        this.httpService.post<{ embedding: number[] }>(
          `${this.nlpBaseUrl}/embed`,
          { text },
          { timeout: 30000 },
        ),
      'embedding generation',
      'Failed to generate embedding',
    );

    return data.embedding;
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

  private async requestFastApi<T>(
    requestFactory: () => Observable<AxiosResponse<T>>,
    operation: string,
    unexpectedMessage: string,
  ): Promise<T> {
    try {
      const response = await firstValueFrom(
        requestFactory().pipe(
          catchError((error: AxiosError) => {
            this.handleAxiosError(error);
            throw error;
          }),
        ),
      );

      return response.data;
    } catch (error: unknown) {
      if (
        error instanceof NlpServiceUnavailableException ||
        error instanceof NlpProcessingException
      ) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Unexpected error during ${operation}: ${message}`);
      throw new NlpProcessingException(unexpectedMessage);
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
      this.handleResponseError(error);
    }

    this.logger.error(`FastAPI communication error: ${error.message}`);
    throw new NlpProcessingException('Error communicating with NLP Service');
  }

  private handleResponseError(error: AxiosError): never {
    const status = error.response?.status;
    const data = error.response?.data;
    this.logger.error(
      `FastAPI returned status ${status}: ${JSON.stringify(data)}`,
    );

    if (status === 422) {
      throw new NlpProcessingException(
        'Invalid input format to NLP Service (422)',
      );
    }

    if (status === 429) {
      throw new NlpServiceUnavailableException(
        `Terlalu banyak permintaan ke layanan AI (429)${this.getRetryMessage(
          error,
        )}`,
      );
    }

    if (status && status >= 500) {
      throw new NlpProcessingException('NLP Service internal error');
    }

    throw new NlpProcessingException('Error communicating with NLP Service');
  }

  private getRetryMessage(error: AxiosError) {
    const headers = error.response?.headers as
      | Record<string, string | string[] | undefined>
      | undefined;
    const retryAfterHeader = headers?.['retry-after'];
    const retryAfter = Array.isArray(retryAfterHeader)
      ? retryAfterHeader[0]
      : retryAfterHeader;

    return retryAfter ? ` (Coba lagi dalam ${retryAfter} detik)` : '';
  }
}
