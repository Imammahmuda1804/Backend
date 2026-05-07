# Task 4.3 — Destination Image Management

> **Phase:** 4 - Destinations
> **Status:** ⬜ Belum Dimulai
> **Estimasi:** 1-2 jam
> **Dependencies:** Task 4.1

---

## Objective

Implementasi upload dan delete gambar galeri destinasi untuk admin.

---

## Endpoints

### POST /admin/destinations/:id/images

Upload gallery image.

Request: `multipart/form-data` dengan field `image`

Logic:
1. Validate file (image format: jpg, png, webp)
2. Validate max file size (5MB)
3. Simpan file ke storage (local `uploads/` atau cloud)
4. Simpan URL ke tabel `destination_images`
5. Return image record

---

### DELETE /admin/destination-images/:id

Delete image.

Logic:
1. Find image by ID
2. Hapus file dari storage
3. Hapus record dari database

---

## Steps

### 1. Setup Multer Configuration

Buat `src/config/multer.config.ts`:

```typescript
export const imageFileFilter = (req, file, callback) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
    callback(new BadRequestException('Only image files are allowed'), false);
  }
  callback(null, true);
};

export const multerImageOptions = {
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
};
```

### 2. Implementasi di Destinations Service

- `uploadImage()` — save file, create db record
- `deleteImage()` — delete file, delete db record

### 3. Tambah di Admin Destinations Controller

- `@Post(':id/images')` — `@UseInterceptors(FileInterceptor('image'))`
- `@Delete('destination-images/:id')`

### 4. Setup Static File Serving

Konfigurasi `ServeStaticModule` untuk serve uploaded files.

---

## Files yang Dimodifikasi/Dibuat

```text
src/config/
├── multer.config.ts                  (new)

src/modules/destinations/
├── admin-destinations.controller.ts  (modified — tambah upload, delete image)
├── destinations.service.ts           (modified — tambah uploadImage, deleteImage)

uploads/destinations/                  (new directory)
```

---

## Acceptance Criteria

- [ ] Upload image berhasil menyimpan file ke disk
- [ ] Upload image menyimpan record di destination_images
- [ ] Upload menolak file non-image (400)
- [ ] Upload menolak file > 5MB (400)
- [ ] Delete image menghapus file dari disk
- [ ] Delete image menghapus record dari database
- [ ] Image URL bisa diakses secara publik (static file serving)
- [ ] Hanya ADMIN yang bisa mengakses
