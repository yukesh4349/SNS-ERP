const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'TeacherProfile'
    `;
    console.log('TeacherProfile columns:');
    console.table(columns);
  } catch (e) {
    console.error('Error fetching columns:', e.message);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
