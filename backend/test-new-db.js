
const { PrismaClient } = require('@prisma/client');
const url = 'postgresql://postgres.pyeufzhlnaoflxokekgh:mokkaRaAsU23@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require';
const prisma = new PrismaClient({
  datasources: { db: { url } }
});

async function main() {
  try {
    await prisma.$connect();
    console.log('CONNECTED successfully to pyeufzhlnaoflxokekgh');
    const usersCount = await prisma.user.count();
    console.log('Users count:', usersCount);
  } catch (e) {
    console.error('FAILED to connect:', e.message);
  }
}

main()
  .finally(async () => await prisma.$disconnect());
