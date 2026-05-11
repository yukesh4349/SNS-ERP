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
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // ─── Student attendance ───────────────────────────────────────
    const students = await this.prisma.user.findMany({
      where: { role: 'parent' },
      include: { studentProfile: true },
      orderBy: { name: 'asc' },
    });

    const activeStudents = students.filter((student) => student.status === 'active');

    // Fetch today's attendance records in one query
    const todayRecords = await this.prisma.attendance.findMany({
      where: { date: today },
    });

    // Index attendance by studentId for fast lookup
    const attendanceMap = new Map<string, string>();
    todayRecords.forEach((rec) => {
      attendanceMap.set(rec.studentId, rec.status);
    });

    // Group students by class
    const classGroups = activeStudents.reduce<Record<string, typeof activeStudents>>((acc, student) => {
      const profile = student.studentProfile;
      const className = profile?.class
        ? `${profile.class}${profile.section ? `-${profile.section}` : ''}`
        : 'Unassigned';
      acc[className] = [...(acc[className] ?? []), student];
      return acc;
    }, {});

    // Build class-wise attendance with real counts
    let totalPresent = 0;
    let totalAbsent = 0;

    const classWiseAttendance = Object.entries(classGroups).map(([className, classStudents]) => {
      let present = 0;
      let absent = 0;

      classStudents.forEach((student) => {
        const sid = student.studentProfile?.studentId ?? student.id.slice(0, 8);
        const status = attendanceMap.get(sid);
        if (status === 'Present' || status === 'P') present++;
        else if (status === 'Absent' || status === 'A') absent++;
      });

      totalPresent += present;
      totalAbsent += absent;

      const marked = present + absent;
      const percentage = marked > 0
        ? `${Math.round((present / marked) * 100)}%`
        : classStudents.length === 0
          ? 'N/A'
          : 'Not marked';

      return {
        class: className,
        total: classStudents.length,
        present,
        absent,
        percentage,
      };
    });

    // Build per-class student lists with today's status
    const studentsAttendance = Object.fromEntries(
      Object.entries(classGroups).map(([className, classStudents]) => [
        className,
        classStudents.map((student) => {
          const sid = student.studentProfile?.studentId ?? student.id.slice(0, 8);
          const dbStatus = attendanceMap.get(sid);
          return {
            rollNo: sid,
            name: student.name,
            status: dbStatus || 'Not Marked',
            photo: '',
          };
        }),
      ]),
    );

    // ─── Teacher attendance ───────────────────────────────────────
    const teachers = await this.prisma.user.findMany({
      where: { role: { in: ['teacher', 'admin'] }, status: 'active' },
      include: { teacherProfile: true },
      orderBy: { name: 'asc' },
    });

    // Look up today's teacher attendance (stored with class = 'FACULTY')
    let teacherPresent = 0;
    let teacherAbsent = 0;

    const teacherList = teachers.map((t) => {
      const teacherId = t.teacherProfile?.employeeId ?? t.id;
      const dbStatus = attendanceMap.get(teacherId);
      if (dbStatus === 'Present' || dbStatus === 'P') teacherPresent++;
      else if (dbStatus === 'Absent' || dbStatus === 'A') teacherAbsent++;
      return {
        id: t.id,
        empId: teacherId,
        name: t.name,
        department: t.department,
        designation: t.teacherProfile?.designation || t.role,
        status: dbStatus || 'Not Marked',
      };
    });

    return {
      summary: {
        present: totalPresent,
        onLeave: totalAbsent,
        lateArrivals: 0,
      },
      teacherSummary: {
        total: teacherList.length,
        present: teacherPresent,
        absent: teacherAbsent,
        notMarked: teacherList.length - teacherPresent - teacherAbsent,
      },
      leaveRequests: [],
      lateArrivals: [],
      teachers: teacherList,
      classWiseAttendance,
      studentsAttendance,
    };
  }
}
