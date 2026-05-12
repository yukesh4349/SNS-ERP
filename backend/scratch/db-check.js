const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('Connected!');

    console.log('Checking StudentProfile columns...');
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'StudentProfile' AND column_name = 'photoUrl'
    `;
    console.log('photoUrl column check result:', result);

    const userCount = await prisma.user.count();
    console.log('Total users in DB:', userCount);

    const users = await prisma.user.findMany({ select: { name: true, email: true, role: true } });
    console.log('Users in DB:', users);

    const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
    console.log('Admin user found:', admin ? 'Yes' : 'No');

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
