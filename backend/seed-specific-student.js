const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const studentId = '8c51b8fd-33bf-4209-8f00-8c96d2d2c45c';
  
  console.log("Searching for student...");
  const user = await prisma.user.findFirst({
    where: { 
      OR: [
        { id: studentId },
        { name: { contains: 'Dharshaneshwarn' } }
      ]
    },
    include: { studentProfile: true }
  });

  if (!user || !user.studentProfile) {
    console.log("Student not found.");
    return;
  }

  const sid = user.studentProfile.id;
  console.log(`Found Student: ${user.name} (${sid})`);

  // Clear existing seeded data for this term
  await prisma.examResult.deleteMany({
    where: { studentId: sid, term: 'Annual Examination 2025-26' }
  });

  const subjects = ['Mathematics', 'Science', 'English', 'Hindi', 'Social'];
  const scores = [
    { internal: 18, exam: 74, total: 92, grade: 'A+' },
    { internal: 17, exam: 68, total: 85, grade: 'A' },
    { internal: 19, exam: 69, total: 88, grade: 'A' },
    { internal: 16, exam: 62, total: 78, grade: 'B+' },
    { internal: 18, exam: 64, total: 82, grade: 'A-' }
  ];

  for (let i = 0; i < subjects.length; i++) {
    await prisma.examResult.create({
      data: {
        studentId: sid,
        term: 'Annual Examination 2025-26',
        subject: subjects[i],
        internal: scores[i].internal,
        exam: scores[i].exam,
        total: scores[i].total,
        grade: scores[i].grade,
        academicYear: '2025-26',
        remarks: 'Arjun is a dedicated student who shows great interest in Mathematics and Science.'
      }
    });
  }

  console.log("Seeding successful!");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
