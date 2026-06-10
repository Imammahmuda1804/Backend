# Panduan Supabase Storage untuk Media RANAHINSIGHT

Panduan ini dipakai untuk memindahkan penyimpanan gambar destinasi, galeri destinasi, dan avatar user dari filesystem backend ke Supabase Storage.

## 1. Buat Bucket Storage

1. Buka Supabase Dashboard.
2. Pilih project database yang dipakai RANAHINSIGHT.
3. Masuk ke menu **Storage**.
4. Klik **New bucket**.
5. Isi:
   - **Name**: `ranahinsight-images`
   - **Public bucket**: aktifkan
   - **File size limit**: minimal `5 MB`
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp`
6. Simpan bucket.

Kenapa public bucket: gambar destinasi dan avatar perlu langsung dibaca web/mobile melalui URL publik. Data sensitif tidak disimpan di bucket ini.

## 2. Ambil Env Supabase

Masuk ke **Project Settings** lalu ambil:

- `SUPABASE_URL`
  - Format: `https://project-ref.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY`
  - Ambil dari bagian API keys.
  - Pakai `service_role`, bukan `anon`.
  - Jangan pernah taruh key ini di frontend/mobile.

Backend membutuhkan env:

```env
SUPABASE_URL=https://project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=isi-service-role-key
SUPABASE_STORAGE_BUCKET=ranahinsight-images
```

## 3. Set Env di Hosting Backend

Tambahkan env di platform hosting backend:

```env
SUPABASE_URL=https://project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=isi-service-role-key
SUPABASE_STORAGE_BUCKET=ranahinsight-images
```

Lalu redeploy backend.

Catatan:

- Jika env Supabase Storage kosong, backend otomatis fallback ke folder `uploads` lokal. Ini hanya aman untuk development lokal.
- Untuk hosting container, isi env Supabase Storage wajib agar file tidak hilang saat redeploy.

## 4. Cara Kerja Setelah Perubahan

Flow upload baru:

```text
Admin/User upload gambar
-> Backend validasi file JPG/PNG/WebP maksimal 5 MB
-> Backend upload buffer ke Supabase Storage
-> Supabase mengembalikan public URL
-> Backend menyimpan public URL ke database
-> Web/Mobile membaca gambar langsung dari public URL
```

Field database tetap memakai field lama:

- `destinations.thumbnail_url`
- `destination_images.image_url`
- `users.profile_picture`

Jadi frontend/mobile tidak perlu perubahan besar karena tetap menerima URL gambar.

## 5. Test Setelah Redeploy

Tes dari admin web:

1. Login sebagai admin.
2. Buka **Admin > Destinasi**.
3. Edit salah satu destinasi.
4. Upload thumbnail baru.
5. Simpan.
6. Pastikan gambar tampil di admin dan halaman detail publik.
7. Cek Supabase Storage bucket, harus ada file baru di folder:
   - `destinations/YYYY-MM-DD/...`

Tes avatar:

1. Login sebagai user.
2. Buka profile.
3. Upload foto profil.
4. Pastikan avatar tampil.
5. Cek bucket folder:
   - `profiles/YYYY-MM-DD/...`

Tes galeri:

1. Upload gambar galeri destinasi.
2. Hapus satu gambar galeri.
3. Pastikan row database hilang dan file storage lama ikut dihapus.

## 6. Migrasi Gambar Lama

Gambar lama dengan URL `/uploads/...` masih bisa dibaca jika backend lama masih menyajikan folder `uploads`.

Untuk hosting container, sebaiknya migrasi dengan salah satu cara:

- Upload ulang gambar dari admin web.
- Atau buat script migrasi terpisah untuk upload file lama ke Supabase Storage dan update URL database.

Untuk demo, upload ulang manual biasanya paling cepat.

## 7. Troubleshooting

### Upload gagal dengan 401/403

Penyebab umum:

- `SUPABASE_SERVICE_ROLE_KEY` salah.
- Yang dipakai adalah `anon key`, bukan `service_role`.
- Env belum masuk ke deployment terbaru.

Solusi:

- Pastikan env backend memakai `service_role`.
- Redeploy backend setelah env diganti.

### Gambar berhasil upload tapi tidak tampil

Penyebab umum:

- Bucket tidak public.
- URL storage tidak bisa diakses browser.

Solusi:

- Aktifkan public bucket.
- Buka public URL gambar langsung di browser.

### Di lokal masih masuk folder uploads

Itu normal jika env Supabase Storage belum diisi. Isi tiga env Supabase di `backend/.env` jika ingin lokal juga upload ke Supabase.
