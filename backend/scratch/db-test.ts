import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.user.count();
    console.log('User count:', count);
    const notifications = await prisma.notification.findMany({ take: 1 });
    console.log('Notifications check:', notifications.length > 0 ? 'Found' : 'None found');
  } catch (error) {
    console.error('Database Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
