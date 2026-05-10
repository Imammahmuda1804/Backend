import { UploadsService } from './uploads.service';
import type { Request } from 'express';
interface RequestWithUser extends Request {
    user?: {
        id: number;
        [key: string]: any;
    };
}
export declare class UploadsController {
    private readonly uploadsService;
    constructor(uploadsService: UploadsService);
    uploadReviews(id: number, file: Express.Multer.File, req: RequestWithUser): Promise<{
        message: string;
        job_id: number;
        total_rows: number;
    }>;
}
export {};
