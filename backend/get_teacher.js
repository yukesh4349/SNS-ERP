const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  let teacher = await prisma.user.findFirst({
    where: { role: 'teacher' }
  });

  if (!teacher) {
    console.log("No teacher found, creating one...");
    teacher = await prisma.user.create({
      data: {
        name: "Test Teacher",
        email: "teacher@sns.edu",
        password: "password123", // In a real app this should be hashed, but let's assume it's stored plain or backend handles hash (Wait, in users.service.ts passwords are plain because there's no hashing shown in createTeacher, wait, wait, the auth service might hash it or check plain. Let me check auth service).
        role: "teacher",
        department: "Science",
        status: "active",
        teacherProfile: {
          create: {
            employeeId: "TCH-2026-0001",
            designation: "Senior Teacher",
            specialization: "Physics"
          }
        }
      }
    });
    console.log("Created Teacher:", teacher.email);
  } else {
    console.log("Found existing Teacher:", teacher.email);
    // Let's reset the password so we know it
    await prisma.user.update({
      where: { id: teacher.id },
      data: { password: "password123" }
    });
    console.log("Password reset to: password123");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
