import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

interface TimetableEntryDto {
  day: string;
  period: number;
  subject: string;
  startTime: string;
  endTime: string;
  teacherId?: string;
}

export interface TimetableConfigDto {
  periodsCount: number;
  lunchAfterPeriod: number;
  timings: { period: number; start: string; end: string }[];
}

@Injectable()
export class TimetableService {
  constructor(private readonly prisma: PrismaService) {}

  async getTimetable() {
    const [classProfiles, teacherCount, timetableClasses] = await Promise.all([
      this.prisma.studentProfile.findMany({
        select: { class: true, section: true },
        distinct: ['class', 'section'],
        orderBy: [{ class: 'asc' }, { section: 'asc' }],
      }),
      this.prisma.user.count({ where: { role: 'teacher', status: 'active' } }),
      // Also get classes that have timetable entries but maybe no student profiles
      this.prisma.timetableEntry.findMany({
        select: { class: true, section: true },
        distinct: ['class', 'section'],
        orderBy: [{ class: 'asc' }, { section: 'asc' }],
      }),
    ]);

    const classLabelSet = new Set<string>();
    classProfiles.forEach((profile) => {
      classLabelSet.add(`${profile.class}${profile.section ? `-${profile.section}` : ''}`);
    });
    timetableClasses.forEach((entry) => {
      classLabelSet.add(`${entry.class}${entry.section ? `-${entry.section}` : ''}`);
    });

    const classLabels = Array.from(classLabelSet).sort();

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

  async getClassTimetable(cls: string, section: string) {
    return this.prisma.timetableEntry.findMany({
      where: {
        class: cls,
        section: section,
      },
      include: {
        teacher: {
          select: { name: true },
        },
      },
      orderBy: [
        { day: 'asc' },
        { period: 'asc' },
      ],
    });
  }

  async saveClassTimetable(cls: string, section: string, entries: TimetableEntryDto[]) {
    // Delete all existing entries for this class+section
    await this.prisma.timetableEntry.deleteMany({
      where: { class: cls, section },
    });

    // Filter out empty-subject entries and create new ones
    const validEntries = entries.filter(e => e.subject && e.subject.trim() !== '');

    if (validEntries.length > 0) {
      await this.prisma.timetableEntry.createMany({
        data: validEntries.map(e => ({
          day: e.day,
          period: e.period,
          subject: e.subject.trim(),
          startTime: e.startTime || '',
          endTime: e.endTime || '',
          class: cls,
          section,
          teacherId: e.teacherId || null,
        })),
      });
    }

    return { success: true, count: validEntries.length };
  }

  async getConfig() {
    const settings = await this.prisma.schoolSettings.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton' },
      update: {},
    });
    return settings.timetableConfig as unknown as TimetableConfigDto;
  }

  async updateConfig(config: TimetableConfigDto) {
    const settings = await this.prisma.schoolSettings.upsert({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        timetableConfig: config as any,
      },
      update: {
        timetableConfig: config as any,
      },
    });
    return settings.timetableConfig;
  }

  async getClassConfig(cls: string, section: string): Promise<TimetableConfigDto> {
    const classConfig = await this.prisma.classTimetableConfig.findUnique({
      where: { class_section: { class: cls, section } },
    });

    if (classConfig) {
      return {
        periodsCount: classConfig.periodsCount,
        lunchAfterPeriod: classConfig.lunchAfterPeriod,
        timings: classConfig.timings as any,
      };
    }

    // Fall back to global config
    return this.getConfig();
  }

  async updateClassConfig(cls: string, section: string, config: TimetableConfigDto) {
    const result = await this.prisma.classTimetableConfig.upsert({
      where: { class_section: { class: cls, section } },
      create: {
        class: cls,
        section,
        periodsCount: config.periodsCount,
        lunchAfterPeriod: config.lunchAfterPeriod,
        timings: config.timings as any,
      },
      update: {
        periodsCount: config.periodsCount,
        lunchAfterPeriod: config.lunchAfterPeriod,
        timings: config.timings as any,
      },
    });
    return {
      periodsCount: result.periodsCount,
      lunchAfterPeriod: result.lunchAfterPeriod,
      timings: result.timings,
    };
  }

  async getTeacherTimetable(teacherId: string) {
    let ids = [teacherId];
    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
      include: { teacherProfile: true },
    });
    if (teacher?.teacherProfile?.employeeId) {
      ids.push(teacher.teacherProfile.employeeId);
    }

    return this.prisma.timetableEntry.findMany({
      where: { teacherId: { in: ids } },
      orderBy: [
        { day: 'asc' },
        { period: 'asc' },
      ],
    });
  }

  async getTeacherNextPeriod(teacherId: string) {
    let ids = [teacherId];
    const teacher = await this.prisma.user.findUnique({
      where: { id: teacherId },
      include: { teacherProfile: true },
    });
    if (teacher?.teacherProfile?.employeeId) {
      ids.push(teacher.teacherProfile.employeeId);
    }

    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[now.getDay()];
    const currentTime = now.getHours() * 100 + now.getMinutes();

    // Find all entries for today
    const todayEntries = await this.prisma.timetableEntry.findMany({
      where: {
        teacherId: { in: ids },
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
