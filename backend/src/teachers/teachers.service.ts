import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  async getTeachers() {
    const teachers = await this.prisma.user.findMany({
      where: { role: { in: ['teacher', 'admin', 'leader'] } },
      include: { teacherProfile: true },
      orderBy: { name: 'asc' },
    });

    const departments = teachers.reduce<Record<string, number>>((acc, teacher) => {
      const department = teacher.department || 'Unassigned';
      acc[department] = (acc[department] ?? 0) + 1;
      return acc;
    }, {});

    return {
      summary: {
        total: teachers.length,
        active: teachers.filter((teacher) => teacher.status === 'active').length,
        overloaded: 0,
      },
      departments: Object.entries(departments).map(([name, count]) => ({
        name,
        teachers: count,
      })),
      teachers: teachers.map((teacher) => ({
        id: teacher.teacherProfile?.employeeId ?? teacher.id,
        name: teacher.name,
        department: teacher.department || 'Unassigned',
        subjects: teacher.teacherProfile?.specialization
          ? [teacher.teacherProfile.specialization]
          : [],
        workload: 'Not scheduled',
        status: teacher.status === 'active' ? 'Active' : 'Inactive',
      })),
    };
  }
}
