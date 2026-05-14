import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { ApifyService } from './apify.service';
export declare class ScraperProcessor extends WorkerHost {
    private readonly prisma;
    private readonly apifyService;
    private readonly logger;
    constructor(prisma: PrismaService, apifyService: ApifyService);
    process(job: Job<any, any, string>): Promise<any>;
    private fetchAndSaveGoogleRating;
    private generateExcel;
}
