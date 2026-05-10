import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        // Hash password
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Create admin user
        const admin = await prisma.user.upsert({
            where: { email: 'admin@wisata.com' },
            update: {},
            create: {
                name: 'Admin User',
                email: 'admin@wisata.com',
                password: hashedPassword,
                role: 'ADMIN',
            },
        });

        console.log('✅ Admin user created successfully!');
        console.log('📧 Email:', admin.email);
        console.log('🔑 Password: admin123');
        console.log('👤 Role:', admin.role);
        console.log('\n🚀 You can now login with these credentials');
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
