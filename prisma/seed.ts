import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

type SeededAdmin = {
  email: string;
  role: Role;
  passwordUpdated: boolean;
};

const TOPIC_GROUPS = [
  {
    groupName: 'Harga & Pengalaman',
    description: 'Kelompok topik tentang biaya, tiket, nilai pengalaman, dan kepuasan kunjungan.',
    keywords: ['harga', 'tiket', 'biaya', 'pengalaman'],
    displayOrder: 1,
  },
  {
    groupName: 'Kebersihan & Kenyamanan',
    description: 'Kelompok topik tentang kebersihan area, kenyamanan, toilet, dan perawatan tempat.',
    keywords: ['bersih', 'kotor', 'nyaman', 'terawat'],
    displayOrder: 2,
  },
  {
    groupName: 'Akses & Lokasi',
    description: 'Kelompok topik tentang akses jalan, parkir, rute, dan kemudahan menuju lokasi.',
    keywords: ['akses', 'jalan', 'parkir', 'lokasi'],
    displayOrder: 3,
  },
  {
    groupName: 'Fasilitas',
    description: 'Kelompok topik tentang fasilitas umum, toilet, mushola, tempat duduk, dan layanan.',
    keywords: ['fasilitas', 'toilet', 'mushola', 'layanan'],
    displayOrder: 4,
  },
  {
    groupName: 'Keramaian',
    description: 'Kelompok topik tentang kepadatan pengunjung, antrean, dan waktu kunjungan.',
    keywords: ['ramai', 'antre', 'pengunjung', 'padat'],
    displayOrder: 5,
  },
  {
    groupName: 'Pemandangan & Aktivitas',
    description: 'Kelompok topik tentang pemandangan, spot foto, aktivitas, dan daya tarik wisata.',
    keywords: ['pemandangan', 'foto', 'aktivitas', 'indah'],
    displayOrder: 6,
  },
  {
    groupName: 'Keamanan & Pengelolaan',
    description: 'Kelompok topik tentang keamanan, pungli, petugas, aturan, dan pengelolaan destinasi.',
    keywords: ['aman', 'pungli', 'petugas', 'pengelolaan'],
    displayOrder: 7,
  },
  {
    groupName: 'Lainnya',
    description: 'Fallback untuk topic yang belum bisa dipetakan ke group utama.',
    keywords: ['lainnya'],
    displayOrder: 99,
  },
];

function loadEnvFile() {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, '');

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function getEnv(name: string, fallback: string) {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : fallback;
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL belum diatur. Isi backend/.env sebelum menjalankan seed.');
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  return { prisma, pool };
}

async function seedAdmin(prisma: PrismaClient): Promise<SeededAdmin> {
  const email = getEnv('SEED_ADMIN_EMAIL', 'admin@wisata.com');
  const name = getEnv('SEED_ADMIN_NAME', 'Admin RANAHINSIGHT');
  const password = getEnv('SEED_ADMIN_PASSWORD', 'admin123');
  const resetPassword = getEnv('SEED_ADMIN_RESET_PASSWORD', 'false') === 'true';
  const existingAdmin = await prisma.user.findUnique({ where: { email } });
  const hashedPassword = await bcrypt.hash(password, 10);

  if (existingAdmin) {
    await prisma.user.update({
      where: { email },
      data: {
        name,
        role: Role.ADMIN,
        status: 'active',
        ...(resetPassword ? { password: hashedPassword } : {}),
      },
    });

    return {
      email,
      role: Role.ADMIN,
      passwordUpdated: resetPassword,
    };
  }

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: Role.ADMIN,
      status: 'active',
    },
  });

  return {
    email,
    role: Role.ADMIN,
    passwordUpdated: true,
  };
}

async function seedTopicGroups(prisma: PrismaClient) {
  let created = 0;
  let updated = 0;

  for (const group of TOPIC_GROUPS) {
    const existing = await prisma.topicGroup.findFirst({
      where: { groupName: group.groupName },
    });

    if (existing) {
      await prisma.topicGroup.update({
        where: { id: existing.id },
        data: group,
      });
      updated += 1;
    } else {
      await prisma.topicGroup.create({ data: group });
      created += 1;
    }
  }

  return { created, updated };
}

async function main() {
  loadEnvFile();
  const { prisma, pool } = createPrismaClient();

  try {
    const admin = await seedAdmin(prisma);
    const topicGroups = await seedTopicGroups(prisma);

    console.log('Seed selesai.');
    console.log(`Admin: ${admin.email} (${admin.role})`);
    console.log(
      admin.passwordUpdated
        ? 'Password admin dibuat/diperbarui dari SEED_ADMIN_PASSWORD.'
        : 'Password admin lama dipertahankan. Pakai SEED_ADMIN_RESET_PASSWORD=true untuk reset.',
    );
    console.log(
      `Topic group: ${topicGroups.created} dibuat, ${topicGroups.updated} diperbarui.`,
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Seed gagal:', error);
  process.exitCode = 1;
});
