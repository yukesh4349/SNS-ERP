const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const teachers = await prisma.user.findMany({
    where: { role: 'teacher' },
    take: 10
  });

  if (teachers.length < 2) {
    console.log('Not enough teachers to seed timetable');
    return;
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History'];
  const classes = ['10', '9', '8', '11'];
  const sections = ['A', 'B', 'C'];

  console.log('Seeding timetable entries...');

  for (const day of days) {
    for (let period = 1; period <= 8; period++) {
      // Assign half of the teachers to a class in each period to simulate "busy" teachers
      const busyTeachers = teachers.slice(0, Math.floor(teachers.length / 2));
      
      for (const teacher of busyTeachers) {
        await prisma.timetableEntry.create({
          data: {
            day,
            period,
            startTime: '09:00',
            endTime: '10:00',
            class: classes[Math.floor(Math.random() * classes.length)],
            section: sections[Math.floor(Math.random() * sections.length)],
            subject: subjects[Math.floor(Math.random() * subjects.length)],
            teacherId: teacher.id,
          }
        });
      }
    }
  }

  console.log('Timetable seeded successfully!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
