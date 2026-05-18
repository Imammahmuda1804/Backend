import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { AiNamingService } from './modules/nlp/ai-naming.service';
import * as fs from 'fs';
import * as path from 'path';

interface TrainingMetadata {
  topic_keywords?: Record<string, string[]>;
}

async function bootstrap() {
  console.log('🔄 Memulai sinkronisasi topik dari metadata BERTopic...');
  const app = await NestFactory.createApplicationContext(AppModule);

  const prisma = app.get(PrismaService);
  const aiNaming = app.get(AiNamingService);

  // __dirname akan berada di backend/src saat dijalankan dengan ts-node
  const metadataPath = path.join(
    __dirname,
    '../../Model/app/models/bertopic/training_metadata.json',
  );

  if (!fs.existsSync(metadataPath)) {
    console.error(`❌ File metadata tidak ditemukan di: ${metadataPath}`);
    console.error(`Pastikan Anda sudah menjalankan script training BERTopic.`);
    await app.close();
    process.exit(1);
  }

  console.log(`📂 Membaca file: ${metadataPath}`);
  const metadata = JSON.parse(
    fs.readFileSync(metadataPath, 'utf-8'),
  ) as TrainingMetadata;
  const topicKeywords = metadata.topic_keywords ?? {};

  // Ambil semua ID kecuali outlier (-1)
  const topicIds = Object.keys(topicKeywords)
    .map((id) => parseInt(id, 10))
    .filter((id) => id !== -1);

  console.log(`📦 Menemukan ${topicIds.length} topik dalam metadata.`);

  let newTopicsCount = 0;
  let updatedTopicsCount = 0;

  for (const topicId of topicIds) {
    const keywords = topicKeywords[String(topicId)] ?? [];

    // Cek apakah topik sudah ada di database
    const existing = await prisma.topic.findUnique({
      where: { id: topicId },
    });

    let topicName = existing?.topicName;

    if (!existing) {
      console.log(`\n🤖 Generate nama AI untuk Topik ID ${topicId}...`);
      // Ini akan memanggil AI Gemini melalui fallback chain
      topicName = await aiNaming.generateTopicName(topicId, keywords);

      await prisma.topic.create({
        data: {
          id: topicId,
          topicName: topicName,
          keywords: keywords,
        },
      });
      newTopicsCount++;
      console.log(`✅ Berhasil membuat Topik [${topicId}]: ${topicName}`);
    } else {
      await prisma.topic.update({
        where: { id: topicId },
        data: { keywords: keywords },
      });
      updatedTopicsCount++;
      console.log(
        `🔄 Update kata kunci untuk Topik [${topicId}] yang sudah ada: ${topicName}`,
      );
    }
  }

  console.log(`\n🎉 Proses Sinkronisasi Selesai!`);
  console.log(`- Topik baru (digenerate oleh AI): ${newTopicsCount}`);
  console.log(`- Topik lama (diupdate kata kuncinya): ${updatedTopicsCount}`);

  await app.close();
  process.exit(0);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
