import { Request } from 'express';
import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';

export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer: Buffer;
}

export const imageFileFilter = (
  req: Request,
  file: MulterFile,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/i)) {
    return callback(
      new BadRequestException('Only image files are allowed'),
      false,
    );
  }
  callback(null, true);
};

export const csvFileFilter = (
  req: Request,
  file: MulterFile,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!file.originalname.match(/\.(csv|xlsx|xls)$/i)) {
    return callback(
      new BadRequestException('Only CSV or Excel files are allowed'),
      false,
    );
  }
  callback(null, true);
};

export const multerImageOptions = {
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  // Gambar disimpan di memori agar bisa langsung dikirim ke object storage.
  storage: memoryStorage(),
};

export const multerCsvOptions = {
  fileFilter: csvFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  // Menyimpan file CSV/Excel di memori.
  // File tersedia melalui file.buffer.
};

export const multerProfileImageOptions = {
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  // Gambar disimpan di memori agar bisa langsung dikirim ke object storage.
  storage: memoryStorage(),
};
