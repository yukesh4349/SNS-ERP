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
}
