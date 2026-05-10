# Format CSV untuk Upload Reviews (Bahasa Indonesia)

## 📋 Format CSV yang Didukung

Sistem mendukung nama kolom dalam **Bahasa Indonesia** dan **Bahasa Inggris**.

---

## ✅ Format Bahasa Indonesia (Recommended)

### Kolom yang Didukung:

| Nama Kolom | Tipe Data | Wajib? | Keterangan | Contoh |
|------------|-----------|--------|------------|--------|
| **Teks Ulasan** / **Ulasan** / **Komentar** | Text | ✅ Ya | Isi review dari pengunjung | "Tempat yang sangat indah!" |
| **Nama Pengulas** / **Nama** / **Penulis** | Text | ❌ Tidak | Nama reviewer | "John Doe" |
| **Rating** / **Nilai** / **Bintang** | Number | ❌ Tidak | Rating 1-5 | 5 |
| **Tanggal Ulasan** / **Tanggal** / **Waktu** | Date | ❌ Tidak | Tanggal review dibuat | "2024-01-15" |
| **Jumlah Suka** / **Suka** / **Berguna** | Number | ❌ Tidak | Jumlah likes/helpful | 10 |

### Contoh CSV (Bahasa Indonesia):

```csv
Nama Pengulas,Teks Ulasan,Rating,Tanggal Ulasan,Jumlah Suka
John Doe,Tempat yang sangat indah dan menyenangkan!,5,2024-01-15,10
Jane Smith,Bagus tapi agak ramai saat weekend.,4,2024-01-20,5
Ahmad,Tempat wisata yang recommended. Fasilitasnya lengkap.,5,2024-02-01,8
Siti,Pemandangannya cantik tapi akses jalan kurang bagus.,3,2024-02-10,2
Budi,Sangat puas dengan kunjungan ini. Akan datang lagi!,5,2024-02-15,15
```

**File contoh:** `sample-reviews-indonesian.csv`

---

## ✅ Format Bahasa Inggris (Juga Didukung)

### Kolom yang Didukung:

| Column Name | Type | Required? | Description | Example |
|-------------|------|-----------|-------------|---------|
| **review_text** / **text** / **content** | Text | ✅ Yes | Review content | "Amazing place!" |
| **reviewer_name** / **name** / **author** | Text | ❌ No | Reviewer name | "John Doe" |
| **rating** / **star** / **score** | Number | ❌ No | Rating 1-5 | 5 |
| **review_date** / **date** / **published** | Date | ❌ No | Review date | "2024-01-15" |
| **likes_count** / **like** / **helpful** | Number | ❌ No | Number of likes | 10 |

### Contoh CSV (Bahasa Inggris):

```csv
reviewer_name,review_text,rating,review_date,likes_count
John Doe,Amazing place with beautiful scenery!,5,2024-01-15,10
Jane Smith,Good but crowded on weekends.,4,2024-01-20,5
Ahmad,Highly recommended tourist destination.,5,2024-02-01,8
```

**File contoh:** `sample-reviews.csv`

---

## 🔍 Deteksi Kolom Otomatis

Sistem akan **otomatis mendeteksi** nama kolom berdasarkan kata kunci:

### Untuk Teks Ulasan:
- ✅ "Teks Ulasan"
- ✅ "Ulasan"
- ✅ "Komentar"
- ✅ "Teks"
- ✅ "review_text"
- ✅ "text"
- ✅ "content"
- ✅ "review"

### Untuk Nama Pengulas:
- ✅ "Nama Pengulas"
- ✅ "Nama"
- ✅ "Penulis"
- ✅ "reviewer_name"
- ✅ "name"
- ✅ "author"
- ✅ "user"

### Untuk Rating:
- ✅ "Rating"
- ✅ "Nilai"
- ✅ "Bintang"
- ✅ "rating"
- ✅ "star"
- ✅ "score"

### Untuk Tanggal:
- ✅ "Tanggal Ulasan"
- ✅ "Tanggal"
- ✅ "Waktu"
- ✅ "review_date"
- ✅ "date"
- ✅ "time"
- ✅ "published"

### Untuk Likes:
- ✅ "Jumlah Suka"
- ✅ "Suka"
- ✅ "Berguna"
- ✅ "likes_count"
- ✅ "like"
- ✅ "helpful"

**Catatan:** Deteksi tidak case-sensitive. "TEKS ULASAN", "teks ulasan", atau "Teks Ulasan" semuanya valid.

---

## 📝 Format Minimal (Hanya Kolom Wajib)

Jika Anda hanya memiliki teks review:

### Bahasa Indonesia:
```csv
Teks Ulasan
Tempat yang sangat indah!
Bagus tapi agak ramai.
Sangat recommended!
```

### Bahasa Inggris:
```csv
review_text
Amazing place!
Good but crowded.
Highly recommended!
```

---

## 📊 Format Lengkap (Semua Kolom)

### Bahasa Indonesia:
```csv
Nama Pengulas,Teks Ulasan,Rating,Tanggal Ulasan,Jumlah Suka
John Doe,Tempat yang sangat indah!,5,2024-01-15,10
Jane Smith,Bagus tapi agak ramai.,4,2024-01-20,5
```

### Bahasa Inggris:
```csv
reviewer_name,review_text,rating,review_date,likes_count
John Doe,Amazing place!,5,2024-01-15,10
Jane Smith,Good but crowded.,4,2024-01-20,5
```

---

## ⚠️ Aturan Penting

### 1. **Kolom Wajib**
- Minimal harus ada **1 kolom** yang berisi teks review
- Nama kolom harus mengandung salah satu kata kunci di atas

### 2. **Format File**
- ✅ CSV (.csv)
- ✅ Excel (.xlsx, .xls)
- ❌ Format lain tidak didukung

### 3. **Ukuran File**
- Maksimal: **10MB**
- Maksimal baris: **50,000 baris**

### 4. **Encoding**
- Gunakan **UTF-8** untuk karakter Indonesia
- Hindari encoding ANSI atau ASCII

### 5. **Format Data**

#### Rating:
- Harus angka 1-5
- Contoh valid: `5`, `4`, `3.5`
- Contoh invalid: `bintang 5`, `lima`

#### Tanggal:
- Format yang didukung:
  - `YYYY-MM-DD` (2024-01-15)
  - `DD/MM/YYYY` (15/01/2024)
  - `DD-MM-YYYY` (15-01-2024)
  - ISO 8601 (2024-01-15T10:00:00Z)

#### Jumlah Suka:
- Harus angka positif
- Contoh valid: `10`, `0`, `100`
- Contoh invalid: `-5`, `sepuluh`

---

## ❌ Error yang Sering Terjadi

### Error 1: "File tidak memiliki kolom yang merepresentasikan teks review"

**Penyebab:**
- Tidak ada kolom dengan nama yang mengandung kata kunci review

**Solusi:**
- Pastikan ada kolom: "Teks Ulasan", "Ulasan", "review_text", atau "text"
- Periksa ejaan nama kolom

**Contoh Salah:**
```csv
Komentar Pengunjung,Rating
Bagus,5
```
❌ "Komentar Pengunjung" tidak terdeteksi (gunakan "Teks Ulasan" atau "Komentar")

**Contoh Benar:**
```csv
Teks Ulasan,Rating
Bagus,5
```
✅ "Teks Ulasan" terdeteksi

---

### Error 2: "File kosong atau tidak memiliki baris data"

**Penyebab:**
- File CSV kosong
- Hanya ada header tanpa data

**Solusi:**
- Pastikan ada minimal 1 baris data setelah header

---

### Error 3: "Jumlah baris melebihi batas maksimal 50.000 baris"

**Penyebab:**
- File terlalu besar

**Solusi:**
- Split file menjadi beberapa bagian
- Upload secara bertahap

---

## 💡 Tips & Best Practices

### 1. **Gunakan Template**
- Download file contoh: `sample-reviews-indonesian.csv`
- Isi dengan data Anda
- Upload

### 2. **Validasi Data Sebelum Upload**
- Pastikan tidak ada baris kosong
- Pastikan rating dalam range 1-5
- Pastikan format tanggal konsisten

### 3. **Encoding UTF-8**
Jika menggunakan Excel:
1. Save As → CSV UTF-8 (Comma delimited)
2. Atau gunakan Google Sheets → Download as CSV

### 4. **Testing**
- Test dengan file kecil dulu (10-20 baris)
- Jika berhasil, upload file lengkap

### 5. **Nama Kolom Fleksibel**
Anda bisa menggunakan variasi nama kolom:
- ✅ "Teks Ulasan"
- ✅ "Ulasan Pengunjung"
- ✅ "Komentar Wisatawan"
- ✅ "Review Text"

Selama mengandung kata kunci ("ulasan", "teks", "review", "text"), akan terdeteksi.

---

## 📥 Cara Upload

### Via Swagger UI:

1. Login sebagai admin
2. Buka: `POST /api/admin/destinations/{id}/upload-reviews`
3. Klik "Try it out"
4. Masukkan destination ID
5. Klik "Choose File"
6. Pilih file CSV
7. Klik "Execute"

### Via cURL:

```bash
curl -X POST "http://localhost:3000/api/admin/destinations/1/upload-reviews" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@sample-reviews-indonesian.csv"
```

---

## 📊 Contoh Data Real

### Data Wisata Jam Gadang:

```csv
Nama Pengulas,Teks Ulasan,Rating,Tanggal Ulasan,Jumlah Suka
Andi,Jam Gadang sangat ikonik dan bersejarah. Wajib dikunjungi!,5,2024-01-10,25
Budi,Tempatnya bagus untuk foto-foto. Area sekitar juga ramai.,4,2024-01-15,18
Citra,Pemandangan dari atas menara sangat indah. Recommended!,5,2024-01-20,30
Dina,Akses mudah dan parkir luas. Cocok untuk keluarga.,4,2024-01-25,12
Eko,Harga tiket terjangkau. Fasilitasnya juga lengkap.,4,2024-02-01,15
```

### Data Wisata Pantai:

```csv
Nama Pengulas,Teks Ulasan,Rating,Tanggal Ulasan,Jumlah Suka
Fitri,Pantainya bersih dan pasirnya putih. Sunset-nya indah!,5,2024-01-10,40
Gita,Ombaknya tenang cocok untuk berenang. Anak-anak suka!,5,2024-01-15,35
Hadi,Warung makan di sekitar pantai banyak dan murah.,4,2024-01-20,20
Ika,Agak ramai saat weekend tapi tetap nyaman.,4,2024-01-25,18
Joko,Spot foto bagus-bagus. Instagramable banget!,5,2024-02-01,50
```

---

## 🎯 Kesimpulan

### Kolom Wajib:
- ✅ **Teks Ulasan** (atau variasi: Ulasan, Komentar, review_text, text)

### Kolom Opsional:
- Nama Pengulas
- Rating
- Tanggal Ulasan
- Jumlah Suka

### Format File:
- CSV, XLSX, atau XLS
- Max 10MB
- Max 50,000 baris
- UTF-8 encoding

### File Contoh:
- `sample-reviews-indonesian.csv` (Bahasa Indonesia)
- `sample-reviews.csv` (Bahasa Inggris)

---

**Sistem sudah siap menerima upload dengan format Bahasa Indonesia!** 🚀

**Last Updated**: 2026-05-08
