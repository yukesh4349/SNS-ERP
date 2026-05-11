const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { role: 'parent' },
    include: { studentProfile: true }
  });

  if (!user || !user.studentProfile) {
    console.log("No student found to seed data for.");
    return;
  }

  const studentId = user.studentProfile.id;
  const studentClass = user.studentProfile.class;
  const studentSection = user.studentProfile.section;

  console.log(`Seeding data for Student: ${user.name} (${studentId})`);

  // 1. Attendance
  await prisma.attendance.upsert({
    where: { studentId_date: { studentId, date: '2026-05-09' } },
    update: { status: 'P' },
    create: { studentId, date: '2026-05-09', status: 'P', class: studentClass, section: studentSection }
  });
  await prisma.attendance.upsert({
    where: { studentId_date: { studentId, date: '2026-05-08' } },
    update: { status: 'P' },
    create: { studentId, date: '2026-05-08', status: 'P', class: studentClass, section: studentSection }
  });

  // 2. Homework
  await prisma.homework.create({
    data: {
      title: 'Math Trigonometry',
      description: 'Complete Exercise 5.3',
      subject: 'Mathematics',
      dueDate: '2026-05-10',
      class: studentClass,
      section: studentSection,
      teacherId: user.id // Just use the same user id for simplicity
    }
  });

  // 3. Exam Results
  await prisma.examResult.create({
    data: {
      studentId,
      term: 'Annual',
      subject: 'Mathematics',
      internal: 19,
      exam: 75,
      total: 94,
      grade: 'A+',
      remarks: 'Excellent work!',
      academicYear: '2025-2026'
    }
  });

  // 4. Timetable
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  for (const day of days) {
    await prisma.timetableEntry.create({
      data: {
        day,
        period: 1,
        startTime: '09:00 AM',
        endTime: '10:00 AM',
        class: studentClass,
        section: studentSection,
        subject: day === 'Monday' ? 'Mathematics' : 'Science',
        teacherId: user.id
      }
    });
  }

  // 5. Announcements (for calendar)
  await prisma.announcement.create({
    data: {
      title: 'Summer Vacation',
      content: 'Summer vacation starts from May 15th.',
      authorId: user.id,
      target: 'all'
    }
  });

  console.log("Seeding completed!");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
