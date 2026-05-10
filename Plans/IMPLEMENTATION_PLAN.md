# 🗺️ IMPLEMENTATION PLAN — Backend NestJS

> **Dokumen ini adalah master plan implementasi backend NestJS berdasarkan Requirements.md.**
> Setiap phase memiliki task file terpisah di folder `Plans/tasks/`.

---

## Referensi

- [Requirements.md](../Requirements/Requirements.md)
- [UML Diagrams](../Requirements/)

---

## Overview Arsitektur

```text
Frontend (Next.js / Flutter)
        ↓
  NestJS Backend (Port 3000)
  ├── Auth Module
  ├── Users Module
  ├── Destinations Module
  ├── Scraper Module
  ├── NLP Integration Module
  ├── Search Module (Semantic)
  ├── Analytics Module
  ├── Favorites Module
  ├── Topics Module
  ├── Reviews Module
  ├── Upload Module
  └── Admin Module
        ↓
  FastAPI NLP Service (Port 8001)
        ↓
  PostgreSQL 16 + pgvector
```

---

## Technology Stack

| Component         | Technology       |
| ----------------- | ---------------- |
| Framework         | NestJS 11        |
| Runtime           | Node.js 20 LTS   |
| Language          | TypeScript 5     |
| ORM               | Prisma ORM       |
| Database          | PostgreSQL 16    |
| Vector Search     | pgvector         |
| Authentication    | JWT + Passport   |
| Queue             | BullMQ + Redis   |
| HTTP Client       | @nestjs/axios    |

---

## Phase Overview

| Phase | Nama | Tasks | Endpoints | Estimasi |
| ------- | ------ | ------- | ----------- | ---------- |  
| 1 | Foundation & Setup | 3 tasks | 0 | 1-2 hari |
| 2 | Authentication | 2 tasks | 4 endpoints | 1-2 hari |
| 3 | User Management | 2 tasks | 6 endpoints | 1 hari |
| 4 | Destinations | 3 tasks | 8 endpoints | 2-3 hari |
| 5 | Scraper | 3 tasks | 7 endpoints | 2-3 hari |
| 6 | NLP & Vector | 3 tasks | 2 endpoints | 2 hari |
| 7 | Semantic Search | 2 tasks | 4 endpoints | 1 hari |
| 8 | Analytics | 3 tasks | 8 endpoints | 2-3 hari |
| 9 | User Features | 3 tasks | 5 endpoints | 1-2 hari |
| 10 | Admin Dashboard & Polish | 3 tasks | 6+ endpoints | 2 hari |
| **TOTAL** | | **27 tasks** | **50+ endpoints** | **~15-20 hari** |

---

## Dependency Graph

```text
Phase 1 (Foundation)
  └──→ Phase 2 (Auth)
         ├──→ Phase 3 (Users)
         ├──→ Phase 4 (Destinations)
         │       └──→ Phase 5 (Scraper)
         │               └──→ Phase 6 (NLP & Vector)
         │                       ├──→ Phase 7 (Search)
         │                       └──→ Phase 8 (Analytics)
         ├──→ Phase 9 (User Features) ← depends on Phase 4
         └──→ Phase 10 (Admin & Polish) ← depends on Phase 8
```

---

## Task Index

### Phase 1: Foundation & Setup
- [Task 1.1](tasks/TASK_1_1_project_init.md) — Project Initialization & Configuration
- [Task 1.2](tasks/TASK_1_2_prisma_schema.md) — Prisma Schema & Database Migration
- [Task 1.3](tasks/TASK_1_3_common_utilities.md) — Common Guards, Decorators, Filters

### Phase 2: Authentication
- [Task 2.1](tasks/TASK_2_1_auth_register_login.md) — Register & Login
- [Task 2.2](tasks/TASK_2_2_auth_refresh_logout.md) — Refresh Token, Logout & JWT Guards

### Phase 3: User Management
- [Task 3.1](tasks/TASK_3_1_user_profile.md) — User Profile (GET/PUT /users/me)
- [Task 3.2](tasks/TASK_3_2_admin_user_management.md) — Admin User CRUD

### Phase 4: Destinations
- [Task 4.1](tasks/TASK_4_1_admin_destination_crud.md) — Admin Destination CRUD
- [Task 4.2](tasks/TASK_4_2_public_destinations.md) — Public Destinations (Recommendations, Detail, Ranking)
- [Task 4.3](tasks/TASK_4_3_destination_images.md) — Destination Image Management

### Phase 5: Scraper
- [Task 5.1](tasks/TASK_5_1_scraper_search_start.md) — Search Google Maps & Start Scraping
- [Task 5.2](tasks/TASK_5_2_scraper_status_history.md) — Status Polling, Jobs, History
- [Task 5.3](tasks/TASK_5_3_scraper_download_process.md) — Download CSV & Process (Trigger NLP)

### Phase 6: NLP & Vector
- [Task 6.1](tasks/TASK_6_1_nlp_integration.md) — NLP Integration Service (FastAPI Client)
- [Task 6.2](tasks/TASK_6_2_vector_service.md) — Vector Service (pgvector Operations)
- [Task 6.3](tasks/TASK_6_3_upload_nlp_pipeline.md) — Upload Reviews & NLP Pipeline

### Phase 7: Semantic Search
- [Task 7.1](tasks/TASK_7_1_semantic_search.md) — Semantic Search Endpoint
- [Task 7.2](tasks/TASK_7_2_search_history.md) — Search History (GET, DELETE)

### Phase 8: Analytics
- [Task 8.1](tasks/TASK_8_1_analytics_dashboard.md) — Analytics Dashboard
- [Task 8.2](tasks/TASK_8_2_destination_analytics.md) — Destination Analytics & Topics
- [Task 8.3](tasks/TASK_8_3_comparison_trends.md) — Comparison, Trends & Export

### Phase 9: User Features
- [Task 9.1](tasks/TASK_9_1_favorites.md) — Favorites (Save, List, Delete)
- [Task 9.2](tasks/TASK_9_2_user_reviews.md) — User Reviews & Rating
- [Task 9.3](tasks/TASK_9_3_topics.md) — Topics (List & Filter)

### Phase 10: Admin Dashboard & Polish
- [Task 10.1](tasks/TASK_10_1_admin_dashboard.md) — Admin Dashboard (Summary, Activity, Trends)
- [Task 10.2](tasks/TASK_10_2_admin_moderation.md) — Admin Moderation & Recalculate
- [Task 10.3](tasks/TASK_10_3_swagger_testing.md) — Swagger Documentation & Testing

---

## Progress Tracking

| Task | Status | Tanggal Mulai | Tanggal Selesai |
|------|--------|---------------|-----------------|
| 1.1 | ✅ Selesai | 2026-05-07 | 2026-05-07 |
| 1.2 | ✅ Selesai | 2026-05-07 | 2026-05-07 |
| 1.3 | ✅ Selesai | 2026-05-07 | 2026-05-07 |
| 2.1 | ✅ Selesai | 2026-05-08 | 2026-05-08 |
| 2.2 | ✅ Selesai | 2026-05-08 | 2026-05-08 |
| 3.1 | ✅ Selesai | 2026-05-08 | 2026-05-08 |
| 3.2 | ✅ Selesai | 2026-05-08 | 2026-05-08 |
| 4.1 | ✅ Selesai | 2026-05-08 | 2026-05-08 |
| 4.2 | ✅ Selesai | 2026-05-08 | 2026-05-08 |
| 4.3 | ✅ Selesai | 2026-05-08 | 2026-05-08 |
| 5.1 | ✅ Selesai | 2026-05-08 | 2026-05-08 |
| 5.2 | ✅ Selesai | 2026-05-08 | 2026-05-08 |
| 5.3 | ✅ Selesai | 2026-05-08 | 2026-05-08 |
| 6.1 | ✅ Selesai | 2026-05-08 | 2026-05-08 |
| 6.2 | ✅ Selesai | 2026-05-08 | 2026-05-08 |
| 6.3 | ✅ Selesai | 2026-05-08 | 2026-05-08 |
| 7.1 | ✅ Selesai | 2026-05-08 | 2026-05-08 |
| 7.2 | ✅ Selesai | 2026-05-08 | 2026-05-08 |
| 8.1 | ✅ Selesai | 2026-05-08 | 2026-05-08 |
| 8.2 | ✅ Selesai | 2026-05-08 | 2026-05-08 |
| 8.3 | ✅ Selesai | 2026-05-08 | 2026-05-08 |
| 9.1 | ✅ Selesai | 2026-05-08 | 2026-05-08 |
| 9.2 | ✅ Selesai | 2026-05-08 | 2026-05-08 |
| 9.3 | ✅ Selesai | 2026-05-08 | 2026-05-08 |
| 10.1 | ✅ Selesai | 2026-05-08 | 2026-05-08 |
| 10.2 | ✅ Selesai | 2026-05-08 | 2026-05-08 |
| 10.3 | ⬜ Belum | - | - |
