require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

async function main() {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });
  
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('🔄 Creating admin user...');
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create or update admin user
    const admin = await prisma.user.upsert({
      where: { email: 'admin@wisata.com' },
      update: {
        role: 'ADMIN',
        password: hashedPassword,
      },
      create: {
        name: 'Admin User',
        email: 'admin@wisata.com',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    console.log('\n✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    admin@wisata.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Role:     ADMIN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🚀 Next steps:');
    console.log('1. Open Swagger UI: http://localhost:3000/api/docs');
    console.log('2. Login with the credentials above');
    console.log('3. Copy the access_token from response');
    console.log('4. Click "Authorize" button and paste: Bearer <token>');
    console.log('5. Now you can access all admin endpoints!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.message.includes('password must be a string')) {
      console.log('\n💡 Tip: Make sure DATABASE_URL in .env is correct');
      console.log('Current DATABASE_URL:', process.env.DATABASE_URL);
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
