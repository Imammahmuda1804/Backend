import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Menyediakan PrismaService secara global.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
// Menyediakan PrismaService sebagai dependency global untuk semua module.
export class PrismaModule {}
