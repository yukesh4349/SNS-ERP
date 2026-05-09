import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getStudentAttendance(studentId: string, month?: string) {
    const where: any = { studentId };
    if (month) where.date = { startsWith: month };
    return this.prisma.attendance.findMany({ where, orderBy: { date: 'asc' } });
  }

  async markAttendance(records: { studentId: string; date: string; status: string; reason?: string; class: string; section: string }[]) {
    const results = await Promise.all(
      records.map((r) =>
        this.prisma.attendance.upsert({
          where: { studentId_date: { studentId: r.studentId, date: r.date } },
          create: { studentId: r.studentId, date: r.date, status: r.status, reason: r.reason ?? null, class: r.class, section: r.section },
          update: { status: r.status, reason: r.reason ?? null },
        }),
      ),
    );
    return { marked: results.length };
  }

  async getAttendance() {
    const students = await this.prisma.user.findMany({
      where: { role: 'parent' },
      include: { studentProfile: true },
      orderBy: { name: 'asc' },
    });

    const activeStudents = students.filter((student) => student.status === 'active');
    const classGroups = activeStudents.reduce<Record<string, typeof activeStudents>>((acc, student) => {
      const profile = student.studentProfile;
      const className = profile?.class
        ? `${profile.class}${profile.section ? `-${profile.section}` : ''}`
        : 'Unassigned';
      acc[className] = [...(acc[className] ?? []), student];
      return acc;
    }, {});

    return {
      summary: {
        present: 0,
        onLeave: 0,
        lateArrivals: 0,
      },
      leaveRequests: [],
      lateArrivals: [],
      classWiseAttendance: Object.entries(classGroups).map(([className, classStudents]) => ({
        class: className,
        total: classStudents.length,
        present: 0,
        absent: 0,
        percentage: 'Not marked',
      })),
      studentsAttendance: Object.fromEntries(
        Object.entries(classGroups).map(([className, classStudents]) => [
          className,
          classStudents.map((student) => ({
            rollNo: student.studentProfile?.studentId ?? student.id.slice(0, 8),
            name: student.name,
            status: 'Not Marked',
            photo: '',
          })),
        ]),
      ),
    };
  }
}
