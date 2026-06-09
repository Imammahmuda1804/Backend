import { Injectable } from '@nestjs/common';
import { NlpProcessingHistoryService } from './nlp-processing-history.service';
import { NlpUploadExecutionService } from './nlp-upload-execution.service';
import { NlpUploadPreparationService } from './nlp-upload-preparation.service';
import { normalizeNlpMode } from './utils/nlp-dedup.util';

/**
 * Facade flow upload NLP yang digunakan controller admin.
 *
 * Controller tetap memakai API yang sama, sedangkan parsing file, history,
 * pemanggilan model, dan cleanup ditangani provider khusus.
 */
@Injectable()
export class NlpUploadService {
  constructor(
    private readonly preparation: NlpUploadPreparationService,
    private readonly history: NlpProcessingHistoryService,
    private readonly execution: NlpUploadExecutionService,
  ) {}

  preflight(file: Express.Multer.File, destinationIdText: string) {
    return this.preparation.preflight(file, destinationIdText);
  }

  getHistory(
    destinationId?: string,
    status?: string,
    page = '1',
    limit = '10',
  ) {
    return this.history.findAll(destinationId, status, page, limit);
  }

  getHistoryDetail(id: string) {
    return this.history.findOne(id);
  }

  async uploadAndProcess(input: {
    file: Express.Multer.File;
    destinationIdStr: string;
    rawMode?: string;
    adminId?: number;
  }) {
    const prepared = await this.preparation.prepareFile(
      input.file,
      input.destinationIdStr,
    );
    const mode = normalizeNlpMode(input.rawMode);
    const runId = await this.history.create({
      destinationId: prepared.destinationId,
      adminId: input.adminId,
      fileName: prepared.fileName,
      fileHash: prepared.fileHash,
      mode,
      totalRows: prepared.hashedReviews.length,
    });

    return this.execution.execute({
      runId,
      destinationId: prepared.destinationId,
      destinationName: prepared.destinationName,
      mode,
      hashedReviews: prepared.hashedReviews,
    });
  }
}
