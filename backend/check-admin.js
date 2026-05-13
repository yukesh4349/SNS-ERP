
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, role: true }
  });
  console.log('All users:', users);
  
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@sns-erp.local' }
  });
  console.log('Admin user found:', admin ? 'Yes' : 'No');
  if (admin) {
    console.log('Admin details:', {
      email: admin.email,
      password: admin.password,
      role: admin.role
    });
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
