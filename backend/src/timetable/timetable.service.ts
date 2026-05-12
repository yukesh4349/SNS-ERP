import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TimetableService {
  constructor(private readonly prisma: PrismaService) {}

  async getTimetable() {
    const [classProfiles, teacherCount] = await Promise.all([
      this.prisma.studentProfile.findMany({
        select: { class: true, section: true },
        distinct: ['class', 'section'],
        orderBy: [{ class: 'asc' }, { section: 'asc' }],
      }),
      this.prisma.user.count({ where: { role: 'teacher', status: 'active' } }),
    ]);

    const classLabels = classProfiles.map((profile) =>
      `${profile.class}${profile.section ? `-${profile.section}` : ''}`,
    );

    return {
      weekLabel: `${new Date().getFullYear()} Academic Schedule`,
      conflicts: [],
      schedule: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => ({
        day,
        periods: [],
      })),
      metadata: {
        classes: classLabels,
        activeTeachers: teacherCount,
      },
    };
  }

  async getTeacherTimetable(teacherId: string) {
    return this.prisma.timetableEntry.findMany({
      where: { teacherId },
      orderBy: [
        { day: 'asc' },
        { period: 'asc' },
      ],
    });
  }

  async getTeacherNextPeriod(teacherId: string) {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[now.getDay()];
    const currentTime = now.getHours() * 100 + now.getMinutes();

    // Find all entries for today
    const todayEntries = await this.prisma.timetableEntry.findMany({
      where: {
        teacherId,
        day: currentDay,
      },
      orderBy: { startTime: 'asc' },
    });

    // Find the first entry that hasn't started yet or is currently happening
    const nextPeriod = todayEntries.find(entry => {
      const entryStart = parseInt(entry.startTime.replace(':', ''));
      return entryStart > currentTime;
    });

    return nextPeriod || null;
  }

  async getStudentTimetable(cls: string, section: string) {
    return this.prisma.timetableEntry.findMany({
      where: {
        class: cls,
        section: section,
      },
      include: {
        teacher: {
          select: { name: true }
        }
      },
      orderBy: [
        { day: 'asc' },
        { period: 'asc' },
      ],
    });
  }

  async getAvailableClasses() {
    return this.prisma.timetableEntry.findMany({
      select: { class: true, section: true },
      distinct: ['class', 'section'],
      orderBy: [{ class: 'asc' }, { section: 'asc' }],
    });
  }
}
