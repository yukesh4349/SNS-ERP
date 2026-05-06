import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SubstitutionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSubstitutions() {
    const [activeTeachers, inactiveTeachers] = await Promise.all([
      this.prisma.user.count({ where: { role: 'teacher', status: 'active' } }),
      this.prisma.user.count({ where: { role: 'teacher', status: 'inactive' } }),
    ]);

    return {
      summary: {
        pendingApproval: 0,
        emergencyReplacements: inactiveTeachers,
        autoAssigned: 0,
      },
      requests: [],
      availability: {
        activeTeachers,
        inactiveTeachers,
      },
    };
  }
}
