import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureSettings() {
    let settings = await this.prisma.schoolSettings.findUnique({
      where: { id: 'singleton' },
    });
    if (!settings) {
      settings = await this.prisma.schoolSettings.create({
        data: { id: 'singleton' },
      });
    }
    return settings;
  }

  async getSettings() {
    const [school, departments] = await Promise.all([
      this.ensureSettings(),
      this.prisma.user.findMany({
        where: { department: { not: '' } },
        distinct: ['department'],
        select: { department: true },
        orderBy: { department: 'asc' },
      }),
    ]);

    return {
      institution: {
        name: school.name,
        academicYear: school.academicYear,
        timezone: school.timezone,
        contactEmail: school.contactEmail,
        contactPhone: school.contactPhone,
        address: school.address,
      },
      departments: departments.map((d) => d.department),
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

  async updateSettings(data: {
    name?: string;
    academicYear?: string;
    timezone?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
  }) {
    await this.ensureSettings();
    const updated = await this.prisma.schoolSettings.update({
      where: { id: 'singleton' },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.academicYear !== undefined && { academicYear: data.academicYear }),
        ...(data.timezone !== undefined && { timezone: data.timezone }),
        ...(data.contactEmail !== undefined && { contactEmail: data.contactEmail }),
        ...(data.contactPhone !== undefined && { contactPhone: data.contactPhone }),
        ...(data.address !== undefined && { address: data.address }),
      },
    });
    return { message: 'Settings saved successfully.', settings: updated };
  }
}
