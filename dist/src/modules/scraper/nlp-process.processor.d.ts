import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { CsvService } from './csv.service';
import { NlpService } from '../nlp/nlp.service';
import { NlpResultStorageService } from '../nlp/nlp-result-storage.service';
export declare class NlpProcessProcessor extends WorkerHost {
    private readonly prisma;
    private readonly csvService;
    private readonly nlpService;
    private readonly nlpStorageService;
    private readonly logger;
    constructor(prisma: PrismaService, csvService: CsvService, nlpService: NlpService, nlpStorageService: NlpResultStorageService);
    process(job: Job<{
        jobId: number;
        destinationId: number;
    }, any, string>): Promise<any>;
}
