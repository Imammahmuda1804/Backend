# Feature Updates - Search History, Profile Picture & User Reviews

## 📋 Ringkasan Perubahan

Tiga fitur telah ditambahkan/diperbaiki:

1. ✅ **Fix Search History** - History search sekarang tersimpan untuk user yang login
2. ✅ **Profile Picture** - User dapat memiliki foto profil
3. ✅ **User Reviews di Detail Destination** - Review yang ditulis user ditampilkan di endpoint detail destinasi

---

## 1. 🔍 Fix Search History

### Masalah
Search history tidak tersimpan ketika user yang login melakukan pencarian.

### Penyebab
Controller menggunakan `@Request() req` untuk mengakses user, tapi seharusnya menggunakan `@CurrentUser()` decorator yang lebih reliable.

### Solusi
**File**: `src/modules/search/search.controller.ts`

**Perubahan**:
```typescript
// SEBELUM
async search(
  @Body() dto: SearchQueryDto,
  @Request() req: { user?: AuthUser },
) {
  const userId = req.user?.id;
  return this.searchService.semanticSearch(dto, userId);
}

// SESUDAH
async search(
  @Body() dto: SearchQueryDto,
  @CurrentUser('id') userId?: number,
) {
  return this.searchService.semanticSearch(dto, userId);
}
```

### Cara Kerja
1. User login dan mendapat JWT token
2. User melakukan search dengan menyertakan token di header: `Authorization: Bearer <token>`
3. `OptionalJwtAuthGuard` memvalidasi token dan populate `req.user`
4. `@CurrentUser('id')` decorator mengekstrak `userId` dari `req.user`
5. `SearchService.semanticSearch()` menerima `userId` dan menyimpan ke `SearchLog` table

### Testing
```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@mail.com","password":"password123"}'

# Response: { "access_token": "eyJhbGc..." }

# 2. Search dengan token
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"query":"pantai indah"}'

# 3. Cek history
curl -X GET http://localhost:3000/api/search/history \
  -H "Authorization: Bearer <token>"

# Expected: History search "pantai indah" muncul
```

### Database
**Tabel**: `search_logs`

```sql
SELECT * FROM search_logs WHERE "user_id" = <userId> ORDER BY created_at DESC;
```

**Expected Result**:
```
id | user_id | keyword       | created_at
---+---------+---------------+-------------------------
1  | 2       | pantai indah  | 2026-05-08 12:00:00
2  | 2       | gunung tinggi | 2026-05-08 11:30:00
```

---

## 2. 👤 Profile Picture

### Fitur Baru
User sekarang dapat memiliki foto profil yang disimpan sebagai URL.

### Database Schema
**File**: `prisma/schema.prisma`

**Perubahan**:
```prisma
model User {
  id             Int      @id @default(autoincrement())
  name           String
  email          String   @unique
  password       String
  role           Role     @default(USER)
  status         String   @default("active")
  profilePicture String?  @map("profile_picture")  // ← BARU
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")
  // ...
}
```

### Migration
**File**: `prisma/migrations/20260508115352_add_profile_picture_to_users/migration.sql`

```sql
ALTER TABLE "users" ADD COLUMN "profile_picture" TEXT;
```

### API Changes

#### 1. Update Profile DTO
**File**: `src/modules/users/dto/update-profile.dto.ts`

```typescript
export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({
    description: 'URL foto profil user',
    example: '/uploads/profiles/user-123.jpg',
  })
  @IsOptional()
  @IsString()
  profilePicture?: string;  // ← BARU
}
```

#### 2. Users Service
**File**: `src/modules/users/users.service.ts`

Semua method yang return user data sekarang include `profilePicture`:
- `findById()`
- `updateProfile()`
- `findAll()`
- `findOneWithRelations()`
- `adminUpdate()`

**Contoh**:
```typescript
async findById(id: number) {
  return this.prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      profilePicture: true,  // ← BARU
      createdAt: true,
    },
  });
}
```

### Endpoints

#### GET /api/users/profile
**Response**:
```json
{
  "status": "success",
  "data": {
    "id": 2,
    "name": "John Doe",
    "email": "john@mail.com",
    "role": "USER",
    "status": "active",
    "profilePicture": "/uploads/profiles/user-2.jpg",
    "createdAt": "2026-05-08T10:00:00.000Z"
  }
}
```

#### PUT /api/users/profile
**Request**:
```json
{
  "name": "John Updated",
  "profilePicture": "/uploads/profiles/user-2-new.jpg"
}
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "id": 2,
    "name": "John Updated",
    "email": "john@mail.com",
    "role": "USER",
    "profilePicture": "/uploads/profiles/user-2-new.jpg",
    "createdAt": "2026-05-08T10:00:00.000Z"
  }
}
```

### Upload Flow (Frontend Implementation)

```javascript
// 1. Upload file ke server
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const uploadResponse = await fetch('/api/upload/profile', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

const { imageUrl } = await uploadResponse.json();
// imageUrl: "/uploads/profiles/user-2.jpg"

// 2. Update profile dengan URL
await fetch('/api/users/profile', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ profilePicture: imageUrl })
});
```

**Note**: Endpoint upload file (`/api/upload/profile`) perlu dibuat terpisah jika belum ada.

---

## 3. 📝 User Reviews di Detail Destination

### Fitur Baru
Endpoint `GET /api/destinations/:id` sekarang include user reviews (review yang ditulis oleh user, bukan dari Google Maps).

### Perbedaan Review Types

| Type | Source | Table | Endpoint |
|------|--------|-------|----------|
| **Google Maps Reviews** | Scraping/CSV Upload | `reviews` | Tidak ditampilkan di public endpoint |
| **User Reviews** | User menulis review | `user_reviews` | ✅ Ditampilkan di detail destination |

### API Changes

**File**: `src/modules/destinations/destinations.service.ts`

**Method**: `findOnePublic(id: number)`

**Perubahan**:
```typescript
async findOnePublic(id: number) {
  const destination = await this.prisma.destination.findFirst({
    where: { id, deletedAt: null },
    include: {
      images: true,
      sentimentTrends: { ... },
      destinationTopics: { ... },
      
      // ← BARU: Include user reviews
      userReviews: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profilePicture: true,  // ← Include foto profil
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  // Aggregate user rating
  const reviewAgg = await this.prisma.userReview.aggregate({
    where: { destinationId: id },
    _avg: { rating: true },
    _count: true,  // ← BARU: Count total reviews
  });

  return {
    ...destination,
    averageUserRating: reviewAgg._avg.rating || destination.userRating,
    totalUserReviews: reviewAgg._count,  // ← BARU
  };
}
```

### Response Example

**Endpoint**: `GET /api/destinations/1`

**Response**:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "Jam Gadang",
    "slug": "jam-gadang",
    "description": "Ikon wisata Bukittinggi...",
    "city": "Bukittinggi",
    "province": "Sumatera Barat",
    "thumbnailUrl": "...",
    "googleRating": 4.5,
    "userRating": null,
    "positiveRatio": 0.8,
    "recommendationScore": 0.4,
    
    "images": [...],
    "sentimentTrends": [...],
    "destinationTopics": [...],
    
    "userReviews": [
      {
        "id": 1,
        "userId": 2,
        "destinationId": 1,
        "rating": 5,
        "reviewText": "Tempat yang sangat indah! Recommended banget.",
        "createdAt": "2026-05-08T10:00:00.000Z",
        "user": {
          "id": 2,
          "name": "John Doe",
          "profilePicture": "/uploads/profiles/user-2.jpg"
        }
      },
      {
        "id": 2,
        "userId": 3,
        "destinationId": 1,
        "rating": 4,
        "reviewText": "Bagus tapi agak ramai saat weekend.",
        "createdAt": "2026-05-07T15:30:00.000Z",
        "user": {
          "id": 3,
          "name": "Jane Smith",
          "profilePicture": null
        }
      }
    ],
    
    "averageUserRating": 4.5,
    "totalUserReviews": 2
  }
}
```

### Frontend Display Example

```jsx
// Destination Detail Page
function DestinationDetail({ destination }) {
  return (
    <div>
      <h1>{destination.name}</h1>
      <p>Average Rating: {destination.averageUserRating} ⭐</p>
      <p>Total Reviews: {destination.totalUserReviews}</p>
      
      <h2>User Reviews</h2>
      {destination.userReviews.map(review => (
        <div key={review.id} className="review-card">
          <div className="review-header">
            <img 
              src={review.user.profilePicture || '/default-avatar.png'} 
              alt={review.user.name}
              className="avatar"
            />
            <div>
              <h4>{review.user.name}</h4>
              <p>Rating: {review.rating} ⭐</p>
              <p>{new Date(review.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <p>{review.reviewText}</p>
        </div>
      ))}
    </div>
  );
}
```

### Database Query

```sql
-- Get destination with user reviews
SELECT 
  d.*,
  json_agg(
    json_build_object(
      'id', ur.id,
      'rating', ur.rating,
      'reviewText', ur.review_text,
      'createdAt', ur.created_at,
      'user', json_build_object(
        'id', u.id,
        'name', u.name,
        'profilePicture', u.profile_picture
      )
    )
  ) as user_reviews
FROM destinations d
LEFT JOIN user_reviews ur ON ur.destination_id = d.id
LEFT JOIN users u ON u.id = ur.user_id
WHERE d.id = 1
GROUP BY d.id;
```

---

## 🧪 Testing

### 1. Test Search History
```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@mail.com","password":"password123"}' \
  | jq -r '.data.access_token')

# Search
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query":"pantai indah"}'

# Check history
curl -X GET http://localhost:3000/api/search/history \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Test Profile Picture
```bash
# Get profile
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer $TOKEN"

# Update profile picture
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"profilePicture":"/uploads/profiles/user-2.jpg"}'
```

### 3. Test User Reviews in Destination
```bash
# Get destination detail
curl -X GET http://localhost:3000/api/destinations/1

# Check if userReviews array is present
```

---

## 📊 Database Changes

### Migration Applied
```
20260508115352_add_profile_picture_to_users
```

### Schema Changes
```sql
-- users table
ALTER TABLE "users" ADD COLUMN "profile_picture" TEXT;
```

### Verify Migration
```sql
-- Check column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'profile_picture';

-- Check data
SELECT id, name, email, profile_picture FROM users LIMIT 5;
```

---

## 🚀 Deployment Checklist

- [x] Schema updated (`prisma/schema.prisma`)
- [x] Migration created and applied
- [x] Prisma client regenerated
- [x] DTOs updated
- [x] Services updated
- [x] Controllers updated
- [x] Build successful
- [ ] Test all endpoints
- [ ] Update API documentation (Swagger)
- [ ] Update frontend to use new fields

---

## 📝 Notes

### Profile Picture Storage
Saat ini `profilePicture` hanya menyimpan URL string. Untuk implementasi lengkap, perlu:

1. **Upload Endpoint** - Buat endpoint untuk upload file foto profil
2. **File Storage** - Simpan file di `uploads/profiles/` directory
3. **Validation** - Validasi file type (jpg, png) dan size (max 2MB)
4. **Image Processing** - Resize/compress image untuk optimasi

### User Reviews vs Google Maps Reviews
- **Google Maps Reviews** (`reviews` table): Dari scraping, digunakan untuk NLP analysis
- **User Reviews** (`user_reviews` table): Ditulis langsung oleh user, ditampilkan di public endpoint

### Search History Privacy
- Search history hanya bisa diakses oleh user yang bersangkutan
- Admin tidak bisa melihat search history user lain (kecuali via database langsung)
- User dapat menghapus history mereka sendiri

---

## 🔗 Related Files

### Modified Files
- `prisma/schema.prisma`
- `src/modules/search/search.controller.ts`
- `src/modules/users/dto/update-profile.dto.ts`
- `src/modules/users/users.service.ts`
- `src/modules/destinations/destinations.service.ts`

### New Files
- `prisma/migrations/20260508115352_add_profile_picture_to_users/migration.sql`

### Documentation
- `FEATURE_UPDATES.md` (this file)
