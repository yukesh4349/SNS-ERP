import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    const departments = await this.prisma.user.findMany({
      where: { department: { not: '' } },
      distinct: ['department'],
      select: { department: true },
      orderBy: { department: 'asc' },
    });

    return {
      institution: {
        name: process.env.INSTITUTION_NAME ?? 'SNS Schools',
        academicYear: process.env.ACADEMIC_YEAR ?? `${new Date().getFullYear()} - ${new Date().getFullYear() + 1}`,
        timezone: process.env.TZ ?? 'Asia/Kolkata',
      },
      departments: departments.map((item) => item.department),
      notifications: [
        {
          channel: 'Email digests',
          status: process.env.SMTP_HOST ? 'Enabled' : 'Not configured',
        },
        {
          channel: 'Firebase push',
          status: process.env.FIREBASE_SERVICE_ACCOUNT ? 'Enabled' : 'Not configured',
        },
        {
          channel: 'Mobile push',
          status: process.env.FIREBASE_SERVICE_ACCOUNT ? 'Enabled' : 'Not configured',
        },
      ],
    };
  }
}
