import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class LeavesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async submitLeave(
    userId: string,
    data: {
      studentName: string;
      class: string;
      section: string;
      startDate: string;
      endDate: string;
      reason: string;
      documentUrl?: string;
    },
  ) {
    const leave = await this.prisma.leaveApplication.create({
      data: { userId, ...data },
    });

    // Notify all admins
    const admins = await this.prisma.user.findMany({
      where: { role: { in: ['admin', 'superadmin', 'leader'] } },
      select: { id: true },
    });

    await Promise.all(
      admins.map((a) =>
        this.notifications.createNotification(
          a.id,
          'Leave Application Received',
          `${data.studentName} (Class ${data.class}-${data.section}) has applied for leave from ${data.startDate} to ${data.endDate}.`,
          'alert',
        ),
      ),
    );

    return { message: 'Leave application submitted successfully.', id: leave.id };
  }

  async getMyLeaves(userId: string) {
    return this.prisma.leaveApplication.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllLeaves() {
    return this.prisma.leaveApplication.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async resolveLeave(id: string, status: 'approved' | 'rejected', adminNote?: string) {
    return this.prisma.leaveApplication.update({
      where: { id },
      data: { status, adminNote: adminNote ?? null },
    });
  }
}
