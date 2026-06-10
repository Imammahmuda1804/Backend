import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import type {
  MediaFolder,
  StoredMedia,
  UploadableImage,
} from './media-storage.types';

const SUPPORTED_IMAGE_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

@Injectable()
export class MediaStorageService {
  private readonly logger = new Logger(MediaStorageService.name);

  constructor(private readonly config: ConfigService) {}

  // Mengunggah gambar ke Supabase Storage jika env tersedia, fallback ke uploads lokal untuk development.
  async uploadImage(
    file: UploadableImage,
    folder: MediaFolder,
  ): Promise<StoredMedia> {
    this.assertValidImage(file);

    if (this.hasSupabaseConfig()) {
      return this.uploadToSupabase(file, folder);
    }

    return this.saveToLocalUploads(file, folder);
  }

  // Menghapus file lama dari Supabase atau folder lokal berdasarkan URL yang tersimpan di database.
  async deleteByPublicUrl(publicUrl?: string | null): Promise<void> {
    if (!publicUrl) return;

    try {
      if (this.isSupabasePublicUrl(publicUrl)) {
        await this.deleteFromSupabase(publicUrl);
        return;
      }

      if (publicUrl.startsWith('/uploads/')) {
        await this.deleteLocalUpload(publicUrl);
      }
    } catch (error: unknown) {
      this.logger.warn(
        `Failed to delete media "${publicUrl}": ${this.getErrorMessage(error)}`,
      );
    }
  }

  private assertValidImage(file: UploadableImage) {
    if (!file.buffer?.length) {
      throw new BadRequestException('File gambar tidak valid atau kosong');
    }

    if (!SUPPORTED_IMAGE_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Format gambar harus JPG, PNG, atau WebP');
    }
  }

  private hasSupabaseConfig() {
    return Boolean(
      this.supabaseUrl &&
      this.supabaseServiceRoleKey &&
      this.supabaseStorageBucket,
    );
  }

  private async uploadToSupabase(
    file: UploadableImage,
    folder: MediaFolder,
  ): Promise<StoredMedia> {
    const key = this.buildStorageKey(file, folder);
    const uploadUrl = `${this.supabaseUrl}/storage/v1/object/${this.supabaseStorageBucket}/${key}`;

    try {
      await axios.post(uploadUrl, file.buffer, {
        headers: {
          ...this.supabaseHeaders,
          'Content-Type': file.mimetype,
          'Cache-Control': '31536000',
          'x-upsert': 'false',
        },
        maxBodyLength: Infinity,
      });
    } catch (error: unknown) {
      throw new InternalServerErrorException(
        `Gagal mengupload gambar ke Supabase Storage: ${this.getErrorMessage(error)}`,
      );
    }

    return {
      publicUrl: this.buildSupabasePublicUrl(key),
      storageKey: key,
      driver: 'supabase',
    };
  }

  private async saveToLocalUploads(
    file: UploadableImage,
    folder: MediaFolder,
  ): Promise<StoredMedia> {
    const fileName = this.buildLocalFileName(file);
    const uploadDir = path.join(process.cwd(), 'uploads', folder);
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, fileName), file.buffer);

    return {
      publicUrl: `/uploads/${folder}/${fileName}`,
      storageKey: `${folder}/${fileName}`,
      driver: 'local',
    };
  }

  private async deleteFromSupabase(publicUrl: string) {
    const key = this.extractSupabaseStorageKey(publicUrl);
    if (!key) return;

    const removeUrl = `${this.supabaseUrl}/storage/v1/object/${this.supabaseStorageBucket}/remove`;
    await axios.post(
      removeUrl,
      { prefixes: [key] },
      { headers: this.supabaseHeaders },
    );
  }

  private async deleteLocalUpload(publicUrl: string) {
    const safeRelativePath = publicUrl
      .replace(/^\/uploads\//, '')
      .split('/')
      .map((segment) => path.basename(segment))
      .join(path.sep);
    const absolutePath = path.join(process.cwd(), 'uploads', safeRelativePath);
    await fs.rm(absolutePath, { force: true });
  }

  private buildStorageKey(file: UploadableImage, folder: MediaFolder) {
    const date = new Date().toISOString().slice(0, 10);
    return `${folder}/${date}/${randomUUID()}.${this.getImageExtension(file)}`;
  }

  private buildLocalFileName(file: UploadableImage) {
    return `${Date.now()}-${randomUUID()}.${this.getImageExtension(file)}`;
  }

  private getImageExtension(file: UploadableImage) {
    return SUPPORTED_IMAGE_TYPES.get(file.mimetype) ?? 'jpg';
  }

  private buildSupabasePublicUrl(key: string) {
    return `${this.supabaseUrl}/storage/v1/object/public/${this.supabaseStorageBucket}/${key}`;
  }

  private isSupabasePublicUrl(publicUrl: string) {
    return Boolean(this.extractSupabaseStorageKey(publicUrl));
  }

  private extractSupabaseStorageKey(publicUrl: string) {
    if (!this.supabaseUrl || !this.supabaseStorageBucket) return null;

    const marker = `${this.supabaseUrl}/storage/v1/object/public/${this.supabaseStorageBucket}/`;
    if (!publicUrl.startsWith(marker)) return null;

    return decodeURIComponent(publicUrl.slice(marker.length));
  }

  private get supabaseUrl() {
    return this.config.get<string>('SUPABASE_URL')?.replace(/\/$/, '');
  }

  private get supabaseServiceRoleKey() {
    return this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
  }

  private get supabaseStorageBucket() {
    return this.config.get<string>(
      'SUPABASE_STORAGE_BUCKET',
      'ranahinsight-images',
    );
  }

  private get supabaseHeaders() {
    const key = this.supabaseServiceRoleKey;
    return {
      apikey: key,
      Authorization: `Bearer ${key}`,
    };
  }

  private getErrorMessage(error: unknown) {
    if (axios.isAxiosError(error)) {
      const responseData: unknown = error.response?.data;
      if (this.hasStringMessage(responseData)) return responseData.message;
      return error.message;
    }

    return error instanceof Error ? error.message : 'Unknown error';
  }

  private hasStringMessage(value: unknown): value is { message: string } {
    return (
      typeof value === 'object' &&
      value !== null &&
      'message' in value &&
      typeof value.message === 'string'
    );
  }
}
