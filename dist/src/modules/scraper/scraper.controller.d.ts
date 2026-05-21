import type { Response } from 'express';
import { ScraperService } from './scraper.service';
export declare class ScraperController {
    private readonly scraperService;
    constructor(scraperService: ScraperService);
    downloadExcel(jobId: number, res: Response): Promise<void>;
}
