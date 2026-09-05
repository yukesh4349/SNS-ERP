import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async canAccessStudentAttendance(userId: string, targetStudentId: string): Promise<boolean> {
    if (!userId || !targetStudentId) return false;
    if (userId === targetStudentId) return true;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { studentProfile: true },
    });

    if (!user) return false;
    if (user.studentProfile?.studentId === targetStudentId || user.studentProfile?.admissionNo === targetStudentId) {
      return true;
    }

    return false;
  }

  async getStudentAttendance(studentId: string, month?: string) {
    const where: any = { studentId };
    if (month) where.date = { startsWith: month };
    return this.prisma.attendance.findMany({ where, orderBy: { date: 'asc' } });
  }

  async getTeacherAttendance(teacherId: string, month?: string) {
    let resolvedId = teacherId;
    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
      include: { teacherProfile: true },
    });
    if (teacher?.teacherProfile?.employeeId) {
      resolvedId = teacher.teacherProfile.employeeId;
    }

    const where: any = {
      studentId: { in: [teacherId, resolvedId] },
    };
    if (month) where.date = { startsWith: month };
    const records = await this.prisma.attendance.findMany({ where, orderBy: { date: 'asc' } });
    
    const present = records.filter(r => r.status === 'Present' || r.status === 'P').length;
    const absent = records.filter(r => r.status === 'Absent' || r.status === 'A').length;
    const total = records.length;
    
    return {
      records,
      workingDays: total,
      present,
      absent,
      percentage: total > 0 ? Math.round((present / total) * 100) : 0
    };
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

  async getClassAttendanceForTeacher(teacherId: string) {
    const today = new Date().toISOString().split('T')[0];
    
    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
      include: { teacherProfile: true }
    });

    if (!teacher?.teacherProfile?.class) {
      return null;
    }

    const { class: cls, section } = teacher.teacherProfile;

    const students = await this.prisma.user.findMany({
      where: {
        role: 'parent',
        status: 'active',
        studentProfile: {
          class: cls,
          section: section ?? undefined
        }
      },
      include: { studentProfile: true }
    });

    const records = await this.prisma.attendance.findMany({
      where: {
        date: today,
        class: cls,
        section: section ?? ''
      }
    });

    const attendanceMap = new Map(records.map(r => [r.studentId, r.status]));

    const present = students.filter(s => {
      const sid = s.studentProfile?.studentId ?? s.id.slice(0, 8);
      const status = attendanceMap.get(sid);
      return status === 'Present' || status === 'P';
    }).length;

    const absent = students.filter(s => {
      const sid = s.studentProfile?.studentId ?? s.id.slice(0, 8);
      const status = attendanceMap.get(sid);
      return status === 'Absent' || status === 'A';
    }).length;

    return {
      class: `${cls}${section ? `-${section}` : ''}`,
      total: students.length,
      present,
      absent,
      percentage: students.length > 0 ? Math.round((present / students.length) * 100) : 0
    };
  }

  async getAttendance(date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // ─── Student attendance ───────────────────────────────────────
    const students = await this.prisma.user.findMany({
      where: { role: 'parent' },
      include: { studentProfile: true },
      orderBy: { name: 'asc' },
    });

    const activeStudents = students.filter((student) => student.status === 'active');

    // Fetch records for the target date
    const targetRecords = await this.prisma.attendance.findMany({
      where: { date: targetDate },
    });

    // Index attendance by studentId for fast lookup
    const attendanceMap = new Map<string, string>();
    targetRecords.forEach((rec) => {
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
            photo: student.studentProfile?.photoUrl || '',
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
        photo: t.teacherProfile?.photoUrl || '',
      };
    });

    return {
      date: targetDate,
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
