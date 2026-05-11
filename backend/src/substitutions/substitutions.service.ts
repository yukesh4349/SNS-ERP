import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SubstitutionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSubstitutions() {
    const requests = await this.prisma.substitution.findMany({
      include: {
        absentTeacher: true,
        substituteTeacher: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const [pendingApproval, emergencyReplacements, autoAssigned] = await Promise.all([
      this.prisma.substitution.count({ where: { status: 'pending' } }),
      this.prisma.substitution.count({ where: { status: 'emergency' } }),
      this.prisma.substitution.count({ where: { notes: { contains: 'Auto' } } }),
    ]);

    return {
      summary: {
        pendingApproval,
        emergencyReplacements,
        autoAssigned,
      },
      requests: requests.map(r => ({
        id: r.id,
        date: r.date,
        period: r.period,
        absentTeacher: r.absentTeacher.name,
        suggestedTeacher: r.substituteTeacher.name,
        status: r.status,
        mode: r.notes?.includes('Auto') ? 'Auto' : 'Manual',
      })),
    };
  }

  async getAvailableSubstitutes(date: string, period: number, absentTeacherId: string) {
    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    
    // 1. Get the absent teacher's info for role matching
    const absentTeacher = await this.prisma.user.findUnique({
      where: { id: absentTeacherId },
      include: { teacherProfile: true },
    });

    if (!absentTeacher) throw new Error('Teacher not found');

    // 2. Get all active teachers
    const allTeachers = await this.prisma.user.findMany({
      where: { 
        role: 'teacher', 
        status: 'active',
        id: { not: absentTeacherId }
      },
      include: { teacherProfile: true },
    });

    // 3. Get teachers who are BUSY at this time
    const busyTeacherIds = await this.prisma.timetableEntry.findMany({
      where: {
        day: dayName,
        period: period,
      },
      select: { teacherId: true },
    }).then(entries => entries.map(e => e.teacherId));

    // 4. Get teachers who already have a SUBSTITUTION at this time
    const substitutionBusyIds = await this.prisma.substitution.findMany({
      where: {
        date: date,
        period: period,
      },
      select: { substituteTeacherId: true },
    }).then(entries => entries.map(e => e.substituteTeacherId));

    const allBusyIds = [...new Set([...busyTeacherIds, ...substitutionBusyIds])];

    // 5. Filter and Rank available teachers
    const available = allTeachers
      .filter(t => !allBusyIds.includes(t.id))
      .map(t => {
        let score = 0;
        const matchesSpec = t.teacherProfile?.specialization === absentTeacher.teacherProfile?.specialization;
        const matchesDept = t.department === absentTeacher.department;

        if (matchesSpec) score += 50;
        if (matchesDept) score += 30;

        return {
          id: t.id,
          name: t.name,
          dept: t.department,
          specialization: t.teacherProfile?.specialization,
          score,
          load: busyTeacherIds.length > 5 ? 'High' : 'Normal', // Simple mock load
        };
      })
      .sort((a, b) => b.score - a.score);

    return available;
  }

  async createSubstitution(data: { date: string; period: number; absentTeacherId: string; substituteTeacherId: string; notes?: string }) {
    return this.prisma.substitution.create({
      data: {
        date: data.date,
        period: data.period,
        absentTeacherId: data.absentTeacherId,
        substituteTeacherId: data.substituteTeacherId,
        notes: data.notes,
        status: 'pending',
      },
    });
  }
}
