# Task 1.1 — Project Initialization & Configuration

> **Phase:** 1 - Foundation & Setup
> **Status:** ⬜ Belum Dimulai
> **Estimasi:** 2-3 jam
> **Dependencies:** Tidak ada

---

## Objective

Inisialisasi project NestJS 11 dengan semua konfigurasi dasar, environment variables, dan dependency installation.

---

## Steps

### 1. Inisialisasi Project NestJS

```bash
npx -y @nestjs/cli new backend --package-manager npm --skip-git
```

### 2. Install Semua Dependencies

```bash
# Core NestJS
npm install @nestjs/config @nestjs/axios @nestjs/bullmq @nestjs/throttler
npm install @nestjs/jwt @nestjs/passport @nestjs/swagger @nestjs/platform-express

# Auth
npm install passport passport-jwt bcrypt

# Security
npm install helmet

# Validation
npm install class-validator class-transformer

# Database
npm install prisma @prisma/client

# Queue
npm install bullmq ioredis

# File handling
npm install multer csv-parser xlsx

# Dev dependencies
npm install -D @types/passport-jwt @types/bcrypt @types/multer
npm install -D prisma
```

### 3. Buat File Environment

Buat file `.env`:

```env
PORT=3000

DATABASE_URL=postgresql://postgres:password@localhost:5432/wisata_db

JWT_SECRET=your-jwt-secret-key-here
JWT_REFRESH_SECRET=your-jwt-refresh-secret-key-here
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

NLP_SERVICE_URL=http://localhost:8001

APIFY_TOKEN=your-apify-token-here

REDIS_HOST=localhost
REDIS_PORT=6379

CORS_ORIGINS=http://localhost:3001,http://localhost:3002
```

### 4. Setup Configuration Module

Buat `src/config/env.config.ts`:

```typescript
import { ConfigModuleOptions } from '@nestjs/config';

export const envConfig: ConfigModuleOptions = {
  isGlobal: true,
  envFilePath: '.env',
};
```

### 5. Setup Swagger Configuration

Buat `src/config/swagger.config.ts`:

```typescript
import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Wisata Recommendation API')
  .setDescription('Backend API untuk sistem rekomendasi wisata berbasis AI')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
```

### 6. Setup main.ts

Konfigurasi `src/main.ts` dengan:

- Global validation pipe
- CORS
- Helmet
- Swagger (`/api/docs`)
- Rate limiting
- Port dari env

### 7. Setup app.module.ts

Register semua global modules:

- ConfigModule
- ThrottlerModule
- BullModule (Redis connection)

---

## Files yang Dibuat

```text
src/
├── main.ts                    (modified)
├── app.module.ts              (modified)
├── config/
│   ├── env.config.ts          (new)
│   └── swagger.config.ts      (new)
.env                            (new)
.env.example                    (new)
```

---

## Acceptance Criteria

- [ ] `npm run start:dev` berjalan tanpa error
- [ ] Swagger UI bisa diakses di `http://localhost:3000/api/docs`
- [ ] Environment variables terbaca dengan benar
- [ ] CORS terkonfigurasi
- [ ] Helmet aktif
- [ ] Rate limiting aktif
- [ ] BullMQ terkoneksi ke Redis
