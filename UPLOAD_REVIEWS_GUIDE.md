# Upload Reviews Guide

## Endpoint: POST /api/admin/destinations/:id/upload-reviews

Upload file CSV atau Excel berisi review data untuk destinasi tertentu.

---

## Requirements

- **Authentication**: Bearer token (Admin role required)
- **File Format**: CSV (.csv) atau Excel (.xlsx, .xls)
- **Max File Size**: 10MB
- **Content-Type**: multipart/form-data

---

## CSV Format

File CSV harus memiliki kolom-kolom berikut (case-insensitive):

| Column Name | Type | Required | Description | Example |
|-------------|------|----------|-------------|---------|
| `reviewer_name` / `name` / `author` | String | No | Nama reviewer | "John Doe" |
| `review_text` / `text` / `content` | String | Yes | Isi review | "Tempat yang bagus..." |
| `rating` / `star` / `score` | Number | No | Rating 1-5 | 5 |
| `review_date` / `date` / `published` | Date | No | Tanggal review | "2024-01-15" |
| `likes_count` / `like` / `helpful` | Number | No | Jumlah likes | 10 |

### Sample CSV:

```csv
reviewer_name,review_text,rating,review_date,likes_count
John Doe,Tempat yang sangat indah!,5,2024-01-15,10
Jane Smith,Bagus tapi agak ramai.,4,2024-01-20,5
Ahmad,Tempat wisata yang recommended.,5,2024-02-01,8
```

**File contoh tersedia di:** `sample-reviews.csv`

---

## How to Upload via Swagger UI

### Step 1: Prepare Destination

Pastikan destinasi sudah ada. Jika belum, buat dulu:

```
POST /api/admin/destinations
{
  "name": "Jam Gadang",
  "city": "Bukittinggi",
  "province": "Sumatera Barat"
}
```

Note destination `id` dari response.

### Step 2: Login as Admin

```
POST /api/auth/login
{
  "email": "admin@wisata.com",
  "password": "admin123"
}
```

Copy `access_token` dan authorize di Swagger UI.

### Step 3: Upload File

1. Buka endpoint: **POST /api/admin/destinations/{id}/upload-reviews**
2. Klik "Try it out"
3. Masukkan `id` destinasi
4. Klik "Choose File" dan pilih CSV/Excel file
5. Klik "Execute"

### Expected Response (202 Accepted):

```json
{
  "status": "success",
  "data": {
    "message": "File uploaded and NLP processing started",
    "job_id": 1,
    "total_rows": 10
  }
}
```

---

## How to Upload via cURL

```bash
curl -X POST "http://localhost:3000/api/admin/destinations/1/upload-reviews" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@sample-reviews.csv"
```

---

## How to Upload via Postman

1. **Method**: POST
2. **URL**: `http://localhost:3000/api/admin/destinations/1/upload-reviews`
3. **Headers**:
   - `Authorization`: `Bearer YOUR_ACCESS_TOKEN`
4. **Body**:
   - Select "form-data"
   - Key: `file` (change type to "File")
   - Value: Select your CSV/Excel file

---

## Processing Flow

```
Upload File
    ↓
Validate File (CSV/XLSX, max 10MB)
    ↓
Parse File Content
    ↓
Validate Rows
    ↓
Create Scraping Job (status: completed)
    ↓
Save Reviews to Database
    ↓
Queue NLP Processing (BullMQ)
    ↓
Return Response (202 Accepted)
    ↓
[Background] NLP Processing
    ↓
[Background] Update Analytics
```

---

## Column Mapping

Service akan otomatis mendeteksi kolom berdasarkan nama (case-insensitive):

| Data Field | Possible Column Names |
|------------|----------------------|
| Reviewer Name | `name`, `author`, `user`, `reviewer_name` |
| Review Text | `text`, `review`, `content`, `review_text` |
| Rating | `rating`, `star`, `score` |
| Date | `date`, `time`, `published`, `review_date` |
| Likes | `like`, `helpful`, `likes_count` |

**Flexible Mapping**: Kolom tidak harus persis sama, service akan mencari yang paling cocok.

---

## Error Handling

### 400 Bad Request

**Cause**: File tidak valid atau format salah

**Response**:
```json
{
  "statusCode": 400,
  "message": "Only CSV or Excel files are allowed",
  "error": "Bad Request"
}
```

**Solution**: Pastikan file berformat .csv, .xlsx, atau .xls

---

### 401 Unauthorized

**Cause**: Token tidak valid atau tidak ada

**Response**:
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Solution**: Login dan gunakan token yang valid

---

### 403 Forbidden

**Cause**: User bukan admin

**Response**:
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "FORBIDDEN"
}
```

**Solution**: Pastikan user memiliki role ADMIN

---

### 404 Not Found

**Cause**: Destinasi tidak ditemukan

**Response**:
```json
{
  "statusCode": 404,
  "message": "Destination not found"
}
```

**Solution**: Pastikan destination ID valid

---

### 413 Payload Too Large

**Cause**: File melebihi 10MB

**Response**:
```json
{
  "statusCode": 413,
  "message": "File melebihi batas maksimal 10MB"
}
```

**Solution**: Compress atau split file menjadi lebih kecil

---

## Monitoring Upload Progress

### Check Scraping Job Status:

```
GET /api/admin/scraper/status/{job_id}
```

Response:
```json
{
  "id": 1,
  "status": "completed",
  "total_reviews": 10,
  "source": "upload",
  "created_at": "2024-01-15T10:00:00Z"
}
```

### Check NLP Processing:

Reviews akan diproses di background. Cek analytics untuk melihat hasil:

```
GET /api/analytics/destination/{destination_id}
```

---

## Best Practices

### 1. File Preparation

- ✅ Use UTF-8 encoding
- ✅ Include header row
- ✅ Remove empty rows
- ✅ Validate data before upload
- ✅ Keep file size under 10MB

### 2. Data Quality

- ✅ Review text should be meaningful (min 10 characters)
- ✅ Rating should be 1-5
- ✅ Dates should be valid format (YYYY-MM-DD, DD/MM/YYYY, etc.)
- ✅ Remove duplicate reviews

### 3. Performance

- ✅ Upload during off-peak hours for large files
- ✅ Split very large datasets into multiple files
- ✅ Monitor NLP processing queue

---

## Troubleshooting

### "Failed to fetch" Error in Swagger

**Possible Causes**:
1. File too large (>10MB)
2. Network timeout
3. CORS issue
4. Server not responding

**Solutions**:
1. Check file size
2. Try with smaller file first
3. Use cURL or Postman instead
4. Check server logs

### File Uploaded but No Reviews Appear

**Possible Causes**:
1. CSV format incorrect
2. Column names not recognized
3. All rows failed validation

**Solutions**:
1. Check CSV format matches sample
2. Use standard column names
3. Check server logs for parsing errors

### NLP Processing Stuck

**Possible Causes**:
1. NLP service not running
2. Redis/BullMQ not connected
3. Queue overloaded

**Solutions**:
1. Check NLP service: `http://localhost:8001/health`
2. Check Redis: `docker ps | grep redis`
3. Check queue: Monitor BullMQ dashboard

---

## Sample Files

### Minimal CSV:
```csv
review_text,rating
"Tempat yang bagus",5
"Kurang memuaskan",2
```

### Complete CSV:
```csv
reviewer_name,review_text,rating,review_date,likes_count
John Doe,Tempat yang sangat indah!,5,2024-01-15,10
Jane Smith,Bagus tapi agak ramai.,4,2024-01-20,5
```

### Excel Format:
Same columns as CSV, saved as .xlsx or .xls

---

## API Response Examples

### Success (202 Accepted):
```json
{
  "status": "success",
  "data": {
    "message": "File uploaded and NLP processing started",
    "job_id": 1,
    "total_rows": 10
  }
}
```

### Error (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "Only CSV or Excel files are allowed",
  "error": "Bad Request",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "path": "/api/admin/destinations/1/upload-reviews"
}
```

---

## Related Endpoints

- `POST /api/admin/destinations` - Create destination
- `GET /api/admin/scraper/jobs` - List all jobs
- `GET /api/admin/scraper/status/:jobId` - Check job status
- `GET /api/analytics/destination/:id` - View analytics
- `POST /api/admin/analytics/recalculate/:id` - Recalculate analytics

---

**Last Updated**: 2026-05-08
**Version**: 1.0.0
