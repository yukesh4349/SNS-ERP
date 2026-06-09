const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up existing database records...');

  // Delete in order to satisfy FK constraints
  await prisma.attendance.deleteMany({});
  await prisma.examResult.deleteMany({});
  await prisma.examSchedule.deleteMany({});
  await prisma.timetableEntry.deleteMany({});
  await prisma.substitution.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.fCMToken.deleteMany({});
  await prisma.groupMember.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.group.deleteMany({});
  await prisma.profileUpdateRequest.deleteMany({});
  await prisma.leaveApplication.deleteMany({});
  await prisma.promotionLog.deleteMany({});
  await prisma.teacherProfile.deleteMany({});
  await prisma.studentProfile.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.schoolSettings.deleteMany({});
  await prisma.roleGroup.deleteMany({});

  console.log('Cleanup completed successfully.');

  // 1. Create School Settings
  console.log('Seeding School Settings...');
  const settings = await prisma.schoolSettings.create({
    data: {
      id: 'singleton',
      name: 'SNS Academy',
      academicYear: '2026-2027',
      timezone: 'Asia/Kolkata',
      contactEmail: 'info@snsacademy.ac.in',
      contactPhone: '+91 98765 43210',
      address: 'SNS Kalvi Nagar, Sathy Main Road, Coimbatore, Tamil Nadu 641035',
    },
  });

  // 2. Create Admin
  console.log('Seeding Admin user...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@sns-erp.local',
      password: 'ChangeMe123!',
      name: 'SNS ERP Admin',
      role: 'admin',
      department: 'Administration',
      status: 'active',
    },
  });

  // 3. Create Teachers
  console.log('Seeding Teachers...');
  const teachersData = [
    {
      email: 'teacher1@sns-erp.local',
      name: 'Mrs. Priya Sharma',
      department: 'Science',
      profile: {
        employeeId: 'TCH-2026-0001',
        designation: 'Class Teacher',
        specialization: 'Physics',
        phone: '9876543211',
        dateOfBirth: '1985-05-15',
        class: '10',
        section: 'A',
      },
    },
    {
      email: 'teacher2@sns-erp.local',
      name: 'Mr. Rajesh Kumar',
      department: 'Mathematics',
      profile: {
        employeeId: 'TCH-2026-0002',
        designation: 'Senior Teacher',
        specialization: 'Algebra',
        phone: '9876543212',
        dateOfBirth: '1980-08-22',
        class: '11',
        section: 'A',
      },
    },
    {
      email: 'teacher3@sns-erp.local',
      name: 'Ms. Anjali Sen',
      department: 'Languages',
      profile: {
        employeeId: 'TCH-2026-0003',
        designation: 'Assistant Teacher',
        specialization: 'English',
        phone: '9876543213',
        dateOfBirth: '1990-12-05',
        class: '10',
        section: 'B',
      },
    },
    {
      email: 'teacher4@sns-erp.local',
      name: 'Mr. David Paul',
      department: 'Computer Science',
      profile: {
        employeeId: 'TCH-2026-0004',
        designation: 'HOD',
        specialization: 'Programming',
        phone: '9876543214',
        dateOfBirth: '1978-03-30',
        class: '12',
        section: 'A',
      },
    },
  ];

  const teachers = [];
  for (const t of teachersData) {
    const user = await prisma.user.create({
      data: {
        email: t.email,
        password: 'ChangeMe123!',
        name: t.name,
        role: 'teacher',
        department: t.department,
        status: 'active',
        teacherProfile: {
          create: t.profile,
        },
      },
      include: {
        teacherProfile: true,
      },
    });
    teachers.push(user);
  }

  // 4. Create Students / Parents
  console.log('Seeding Students and Parents...');
  const studentsData = [
    {
      email: 'parent1@sns-erp.local',
      name: 'Aarav Sharma',
      profile: {
        studentId: 'STD-2026-0001',
        class: '10',
        section: 'A',
        phone: '9123456781',
        gender: 'Male',
        dob: '2011-04-10',
        fatherName: 'Mr. Sharma',
        fatherContact: '9123456781',
        fatherEmail: 'sharma@sns-erp.local',
      },
    },
    {
      email: 'parent2@sns-erp.local',
      name: 'Diya Kumar',
      profile: {
        studentId: 'STD-2026-0002',
        class: '11',
        section: 'A',
        phone: '9123456782',
        gender: 'Female',
        dob: '2010-09-18',
        fatherName: 'Mr. Kumar',
        fatherContact: '9123456782',
        fatherEmail: 'kumar@sns-erp.local',
      },
    },
    {
      email: 'parent3@sns-erp.local',
      name: 'Rohan Sen',
      profile: {
        studentId: 'STD-2026-0003',
        class: '10',
        section: 'B',
        phone: '9123456783',
        gender: 'Male',
        dob: '2011-07-25',
        fatherName: 'Mr. Sen',
        fatherContact: '9123456783',
        fatherEmail: 'sen@sns-erp.local',
      },
    },
    {
      email: 'parent4@sns-erp.local',
      name: 'Sneha Paul',
      profile: {
        studentId: 'STD-2026-0004',
        class: '12',
        section: 'A',
        phone: '9123456784',
        gender: 'Female',
        dob: '2009-02-14',
        fatherName: 'Mr. Paul',
        fatherContact: '9123456784',
        fatherEmail: 'paul@sns-erp.local',
      },
    },
    {
      email: 'parent5@sns-erp.local',
      name: 'Karan Sharma',
      profile: {
        studentId: 'STD-2026-0005',
        class: '10',
        section: 'A',
        phone: '9123456785',
        gender: 'Male',
        dob: '2011-11-05',
        fatherName: 'Mr. Sharma',
        fatherContact: '9123456785',
      },
    },
    {
      email: 'parent6@sns-erp.local',
      name: 'Ananya Kumar',
      profile: {
        studentId: 'STD-2026-0006',
        class: '10',
        section: 'A',
        phone: '9123456786',
        gender: 'Female',
        dob: '2011-03-22',
        fatherName: 'Mr. Kumar',
        fatherContact: '9123456786',
      },
    },
  ];

  const students = [];
  for (const s of studentsData) {
    const user = await prisma.user.create({
      data: {
        email: s.email,
        password: 'ChangeMe123!',
        name: s.name,
        role: 'parent',
        department: 'Primary',
        status: 'active',
        studentProfile: {
          create: s.profile,
        },
      },
      include: {
        studentProfile: true,
      },
    });
    students.push(user);
  }

  // 5. Create Timetable Entries
  console.log('Seeding Timetable Entries...');
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const subjects = [
    { name: 'Mathematics', teacher: teachers[1] },
    { name: 'Physics', teacher: teachers[0] },
    { name: 'Chemistry', teacher: teachers[0] },
    { name: 'English', teacher: teachers[2] },
    { name: 'Computer Science', teacher: teachers[3] },
  ];

  const periods = [
    { period: 1, startTime: '08:30', endTime: '09:20' },
    { period: 2, startTime: '09:20', endTime: '10:10' },
    { period: 3, startTime: '10:30', endTime: '11:20' },
    { period: 4, startTime: '11:20', endTime: '12:10' },
    { period: 5, startTime: '13:00', endTime: '13:50' },
  ];

  // Let's populate timetable entries for Class 10-A
  for (const day of days) {
    for (let i = 0; i < periods.length; i++) {
      const subjectIndex = (days.indexOf(day) + i) % subjects.length;
      const subj = subjects[subjectIndex];
      await prisma.timetableEntry.create({
        data: {
          day,
          period: periods[i].period,
          startTime: periods[i].startTime,
          endTime: periods[i].endTime,
          class: '10',
          section: 'A',
          subject: subj.name,
          teacherId: subj.teacher.id,
        },
      });
    }
  }

  // Let's populate timetable entries for Class 11-A
  for (const day of days) {
    for (let i = 0; i < periods.length; i++) {
      const subjectIndex = (days.indexOf(day) + i + 1) % subjects.length;
      const subj = subjects[subjectIndex];
      await prisma.timetableEntry.create({
        data: {
          day,
          period: periods[i].period,
          startTime: periods[i].startTime,
          endTime: periods[i].endTime,
          class: '11',
          section: 'A',
          subject: subj.name,
          teacherId: subj.teacher.id,
        },
      });
    }
  }

  // 6. Create Announcements
  console.log('Seeding Announcements...');
  await prisma.announcement.createMany({
    data: [
      {
        title: 'Academic Year 2026-2027 Welcome Note',
        content: 'We are thrilled to welcome all staff and students back to school. Let us make this year our best one yet!',
        authorId: admin.id,
        target: 'all',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
      {
        title: 'Science Fair Project Guidelines',
        content: 'The guidelines for the upcoming Science Fair have been updated. All students must submit their projects by end of this month.',
        authorId: teachers[0].id,
        target: 'parents',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        title: 'Staff Meeting on Friday',
        content: 'Important staff meeting in the main hall at 3:00 PM this Friday. Attendance is mandatory for all teachers.',
        authorId: admin.id,
        target: 'staff',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
    ],
  });

  // 7. Create Exam Schedules
  console.log('Seeding Exam Schedules...');
  const examDates = ['2026-06-15', '2026-06-16', '2026-06-17', '2026-06-18', '2026-06-19'];
  const examSubjects = ['Mathematics', 'Physics', 'Chemistry', 'English', 'Computer Science'];

  for (let i = 0; i < examSubjects.length; i++) {
    await prisma.examSchedule.create({
      data: {
        class: '10',
        section: 'A',
        subject: examSubjects[i],
        examDate: examDates[i],
        startTime: '09:30 AM',
        duration: '3 Hours',
        hall: `Hall ${i + 1}`,
        term: 'Term 1',
        academicYear: '2026-2027',
      },
    });
  }

  // 8. Create Exam Results
  console.log('Seeding Exam Results...');
  const studentProfiles = students.map(s => s.studentProfile).filter(Boolean);
  for (const sp of studentProfiles) {
    // Standard results for some subjects
    await prisma.examResult.create({
      data: {
        studentId: sp.studentId,
        term: 'Term 1',
        subject: 'Mathematics',
        internal: 18,
        exam: 75,
        total: 93,
        grade: 'A+',
        remarks: 'Excellent problem solving skills.',
        academicYear: '2026-2027',
        isApproved: true,
      },
    });
    await prisma.examResult.create({
      data: {
        studentId: sp.studentId,
        term: 'Term 1',
        subject: 'English',
        internal: 19,
        exam: 68,
        total: 87,
        grade: 'A',
        remarks: 'Good writing skills.',
        academicYear: '2026-2027',
        isApproved: true,
      },
    });
  }

  // 9. Create Attendance (for the last 3 days)
  console.log('Seeding Attendance records...');
  const today = new Date();
  const pastDates = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    pastDates.push(d.toISOString().split('T')[0]);
  }

  for (const date of pastDates) {
    // Students attendance
    for (const student of students) {
      if (student.studentProfile) {
        // Randomly set present or absent
        const isAbsent = Math.random() < 0.1; // 10% absence rate
        await prisma.attendance.create({
          data: {
            studentId: student.studentProfile.studentId,
            date,
            status: isAbsent ? 'Absent' : 'Present',
            reason: isAbsent ? 'Unwell' : null,
            class: student.studentProfile.class,
            section: student.studentProfile.section,
          },
        });
      }
    }

    // Teachers attendance (storing with class = 'FACULTY')
    for (const teacher of teachers) {
      if (teacher.teacherProfile) {
        const isAbsent = Math.random() < 0.05; // 5% absence rate
        await prisma.attendance.create({
          data: {
            studentId: teacher.teacherProfile.employeeId,
            date,
            status: isAbsent ? 'Absent' : 'Present',
            reason: isAbsent ? 'Personal leave' : null,
            class: 'FACULTY',
            section: 'STAFF',
          },
        });
      }
    }
  }

  console.log('Database seeded successfully! 🎉');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
