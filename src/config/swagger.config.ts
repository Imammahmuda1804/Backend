import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Wisata Recommendation API')
  .setDescription(
    'Backend API untuk sistem rekomendasi wisata berbasis AI. ' +
      'Menyediakan endpoint untuk autentikasi, manajemen destinasi, ' +
      'scraping ulasan, analisis sentimen, semantic search, dan analytics dashboard.',
  )
  .setVersion('1.0')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'Authorization',
      description: 'Masukkan JWT token',
      in: 'header',
    },
    // Tidak pakai nama custom — pakai default 'bearer'
    // Menyamakan skema bearer dengan decorator Swagger.
  )
  .addTag('Health', 'Health Check')
  .addTag('Authentication', 'Autentikasi & Otorisasi')
  .addTag('Users', 'Manajemen Profil User')
  .addTag('Public - Destinations', 'Destinasi Wisata (Public)')
  .addTag('Search', 'Semantic Search')
  .addTag('Favorites', 'Wishlist / Favorit')
  .addTag('User Reviews', 'Rating & Review User')
  .addTag('Topics', 'Topic Modeling Results')
  .addTag('Routes', 'Rute Wisata (Public)')
  .addTag('Analytics - Public', 'Analytics Dashboard (Public)')
  .addTag('Admin - Users', 'Admin: Manajemen User')
  .addTag('Admin - Destinations', 'Admin: CRUD Destinasi')
  .addTag('Admin - Scraper', 'Admin: Scraping Google Maps')
  .addTag('Admin - Analytics', 'Admin: Analytics, Dashboard & Export')
  .addTag('Admin - Reviews', 'Admin: Moderasi Review')
  .addTag('Admin - Moderation', 'Admin: Moderasi User Review & Recalculate')
  .addTag('Admin - NLP Processing', 'Admin: Upload & Proses NLP')
  .addTag('Admin - Topics', 'Admin: Manajemen Topik')
  .addTag('Admin - Routes', 'Admin: Manajemen Rute Wisata')
  .build();
