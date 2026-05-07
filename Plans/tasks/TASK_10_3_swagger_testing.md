# Task 10.3 — Swagger Documentation & Testing

> **Phase:** 10 - Admin Dashboard & Polish
> **Status:** ⬜ Belum Dimulai
> **Estimasi:** 3-4 jam
> **Dependencies:** Semua task sebelumnya

---

## Objective

Finalisasi Swagger documentation untuk semua endpoint, tambahkan Swagger decorators pada semua DTOs, dan pastikan semua endpoint berfungsi end-to-end.

---

## Steps

### 1. Swagger Decorators pada Semua DTOs

Tambahkan `@ApiProperty()` pada semua DTO fields:

```typescript
export class CreateDestinationDto {
  @ApiProperty({ description: 'Nama destinasi wisata', example: 'Jam Gadang' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Deskripsi destinasi', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
```

### 2. Swagger Decorators pada Semua Controllers

Tambahkan pada setiap endpoint:
- `@ApiTags('module-name')` — grouping
- `@ApiOperation({ summary: '...' })` — description
- `@ApiResponse({ status: 200, description: '...' })` — response docs
- `@ApiBearerAuth()` — untuk protected endpoints

```typescript
@ApiTags('destinations')
@Controller('destinations')
export class DestinationsController {

  @Get('recommendations')
  @Public()
  @ApiOperation({ summary: 'Get recommended destinations' })
  @ApiResponse({ status: 200, description: 'Paginated list of recommendations' })
  async getRecommendations(@Query() query: PaginationQueryDto) { ... }
}
```

### 3. Swagger API Groups

Pastikan semua module diorganisasi di Swagger UI:

| Tag | Endpoints |
|---|---|
| Auth | /auth/* |
| Users | /users/* |
| Destinations | /destinations/* |
| Search | /search/* |
| Favorites | /favorites/* |
| User Reviews | /user-reviews/* |
| Topics | /topics/* |
| Analytics | /analytics/* |
| Admin - Users | /admin/users/* |
| Admin - Destinations | /admin/destinations/* |
| Admin - Scraper | /admin/scraper/* |
| Admin - Dashboard | /admin/dashboard/* |
| Admin - Analytics | /admin/analytics/* |

### 4. End-to-End Testing Checklist

Lakukan test manual via Swagger UI (`/api/docs`):

#### Auth Flow
- [ ] Register → Login → Get access_token
- [ ] Use access_token untuk protected endpoints
- [ ] Refresh token → Get new pair
- [ ] Logout

#### User Flow
- [ ] Get profile → Update profile
- [ ] Search destinations → View detail
- [ ] Save favorite → List favorites → Remove favorite
- [ ] Submit review/rating

#### Admin Flow
- [ ] Login as admin
- [ ] Create destination → Upload images
- [ ] Search Google Maps → Start scraping
- [ ] Poll scraping status → Download CSV
- [ ] Process NLP pipeline
- [ ] View analytics dashboard
- [ ] Compare two destinations
- [ ] Export analytics CSV
- [ ] Recalculate analytics
- [ ] Moderate reviews
- [ ] Manage users

#### Semantic Search Flow
- [ ] Search query → Get ranked results
- [ ] View search history → Clear history

#### Upload Flow
- [ ] Upload CSV → NLP processing → Analytics updated

### 5. Performance Check

- [ ] All endpoints respond < 500ms
- [ ] Paginated endpoints handle large datasets
- [ ] BullMQ jobs complete without memory leaks
- [ ] pgvector queries use proper indexes

### 6. Security Check

- [ ] All admin endpoints reject non-admin users (403)
- [ ] All protected endpoints reject no-token requests (401)
- [ ] CORS properly configured
- [ ] Rate limiting active
- [ ] Helmet headers present
- [ ] Passwords never returned in responses
- [ ] SQL injection prevented (Prisma parameterized queries)

---

## Files yang Dimodifikasi

```text
Semua file DTO — tambah @ApiProperty()
Semua file Controller — tambah @ApiTags, @ApiOperation, @ApiResponse
src/config/swagger.config.ts — finalize configuration
```

---

## Acceptance Criteria

- [ ] Swagger UI accessible di /api/docs
- [ ] Semua 50+ endpoints terdokumentasi
- [ ] Semua DTO properties memiliki description dan example
- [ ] Semua endpoint bisa di-test via Swagger UI
- [ ] Auth flow end-to-end berfungsi
- [ ] Admin full flow end-to-end berfungsi
- [ ] User full flow end-to-end berfungsi
- [ ] No security vulnerabilities
- [ ] Performance acceptable (< 500ms per request)
