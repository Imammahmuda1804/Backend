import { Request } from 'express';
export interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
}
export declare const imageFileFilter: (req: Request, file: MulterFile, callback: (error: Error | null, acceptFile: boolean) => void) => void;
export declare const csvFileFilter: (req: Request, file: MulterFile, callback: (error: Error | null, acceptFile: boolean) => void) => void;
export declare const multerImageOptions: {
    fileFilter: (req: Request, file: MulterFile, callback: (error: Error | null, acceptFile: boolean) => void) => void;
    limits: {
        fileSize: number;
    };
    storage: import("multer").StorageEngine;
};
export declare const multerCsvOptions: {
    fileFilter: (req: Request, file: MulterFile, callback: (error: Error | null, acceptFile: boolean) => void) => void;
    limits: {
        fileSize: number;
    };
};
