import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
// Mengelola koneksi Prisma Client dan lifecycle database NestJS.
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  // Membuat Prisma Client dengan adapter PostgreSQL Prisma v7.
  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  // Membuka koneksi database saat module diinisialisasi.
  async onModuleInit() {
    await this.$connect();
  }

  // Menutup koneksi database saat aplikasi berhenti.
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
