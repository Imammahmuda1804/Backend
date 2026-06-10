export type MediaFolder = 'destinations' | 'profiles';

export type UploadableImage = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

export type StoredMedia = {
  publicUrl: string;
  storageKey: string;
  driver: 'supabase' | 'local';
};
