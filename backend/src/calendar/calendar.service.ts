import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  async getEvents() {
    return this.prisma.calendarEvent.findMany({
      orderBy: { startDate: 'asc' },
    });
  }

  async createEvent(data: {
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    type: string;
    allDay?: boolean;
  }) {
    return this.prisma.calendarEvent.create({
      data: {
        title: data.title,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        type: data.type,
        allDay: data.allDay ?? true,
      },
    });
  }

  async getTeacherAttendance(teacherId: string) {
    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
      include: { teacherProfile: true },
    });

    if (!teacher?.teacherProfile?.employeeId) {
      return [];
    }

    return this.prisma.attendance.findMany({
      where: {
        studentId: teacher.teacherProfile.employeeId,
        class: 'FACULTY',
      },
      orderBy: { date: 'desc' },
    });
  }

  async getTeacherAttendanceSummary(teacherId: string) {
    const records = await this.getTeacherAttendance(teacherId);
    
    const present = records.filter(r => r.status === 'Present' || r.status === 'P').length;
    const absent = records.filter(r => r.status === 'Absent' || r.status === 'A').length;
    const workingDays = records.length;

    return {
      present,
      absent,
      workingDays,
      percentage: workingDays > 0 ? Math.round((present / workingDays) * 100) : 0,
      records: records.map(r => ({
        date: r.date,
        status: r.status,
      }))
    };
  }
}
