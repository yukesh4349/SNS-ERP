import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getReports() {
    const [students, teachers, inactiveStudents, notifications, messages] = await Promise.all([
      this.prisma.user.count({ where: { role: 'parent', status: 'active' } }),
      this.prisma.user.count({ where: { role: 'teacher', status: 'active' } }),
      this.prisma.user.count({ where: { role: 'parent', status: 'inactive' } }),
      this.prisma.notification.count(),
      this.prisma.message.count(),
    ]);

    return {
      availableReports: [
        {
          title: 'Student directory',
          description:
            'Live export source for active and inactive student account records.',
          format: 'CSV ready',
        },
        {
          title: 'Staff directory',
          description:
            'Live export source for teacher and staff account records.',
          format: 'CSV ready',
        },
        {
          title: 'Communication activity',
          description:
            'Notification and message counts from the communication modules.',
          format: 'Summary ready',
        },
      ],
      highlights: [
        {
          metric: 'Active students',
          value: students.toString(),
        },
        {
          metric: 'Active teachers',
          value: teachers.toString(),
        },
        {
          metric: 'Inactive students',
          value: inactiveStudents.toString(),
        },
        {
          metric: 'Notifications',
          value: notifications.toString(),
        },
        {
          metric: 'Messages',
          value: messages.toString(),
        },
      ],
    };
  }
}
