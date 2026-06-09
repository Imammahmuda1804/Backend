import { extname } from 'path';
import { Request } from 'express';
import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import * as fs from 'fs';

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

const uploadDir = './uploads/destinations';
const profileDir = './uploads/profiles';

const ensureDirectory = (path: string) => {
  if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true });
};

const createUniqueFileName =
  (prefix = '') =>
  (
    req: Request,
    file: MulterFile,
    callback: (error: Error | null, filename: string) => void,
  ) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    callback(null, `${prefix}${uniqueSuffix}${ext}`);
  };

ensureDirectory(uploadDir);
ensureDirectory(profileDir);

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

  storage: diskStorage({
    destination: uploadDir,
    filename: createUniqueFileName(),
  }),
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

  storage: diskStorage({
    destination: profileDir,
    filename: createUniqueFileName('avatar-'),
  }),
};
