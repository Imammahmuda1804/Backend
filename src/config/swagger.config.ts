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
  .addTag('Auth', 'Autentikasi & Otorisasi')
  .addTag('Users', 'Manajemen Profil User')
  .addTag('Destinations', 'Destinasi Wisata (Public)')
  .addTag('Search', 'Semantic Search')
  .addTag('Favorites', 'Wishlist / Favorit')
  .addTag('User Reviews', 'Rating & Review User')
  .addTag('Topics', 'Topic Modeling Results')
  .addTag('Analytics', 'Analytics & Dashboard')
  .addTag('Admin - Users', 'Admin: Manajemen User')
  .addTag('Admin - Destinations', 'Admin: CRUD Destinasi')
  .addTag('Admin - Scraper', 'Admin: Scraping Google Maps')
  .addTag('Admin - Dashboard', 'Admin: Dashboard Summary')
  .addTag('Admin - Analytics', 'Admin: Analytics & Export')
  .build();
