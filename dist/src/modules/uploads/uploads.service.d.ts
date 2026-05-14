import { PrismaService } from '../../prisma/prisma.service';
import { FileParserService } from './file-parser.service';
import { Queue } from 'bullmq';
export declare class UploadsService {
    private readonly prisma;
    private readonly fileParser;
    private readonly nlpQueue;
    private readonly logger;
    constructor(prisma: PrismaService, fileParser: FileParserService, nlpQueue: Queue);
    processUpload(destinationId: number, file: Express.Multer.File, adminId?: number): Promise<{
        message: string;
        job_id: number;
        total_rows: number;
    }>;
}
