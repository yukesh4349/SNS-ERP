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

    // Notify all admins safely (never block leave creation if notification fails)
    try {
      const admins = await this.prisma.user.findMany({
        where: { role: { in: ['admin', 'leader'] } },
        select: { id: true },
      });

      await Promise.allSettled(
        admins.map((a) =>
          this.notifications.createNotification(
            a.id,
            'Leave Application Received',
            `${data.studentName} (Class ${data.class}-${data.section}) has applied for leave from ${data.startDate} to ${data.endDate}.`,
            'alert',
          ),
        ),
      );
    } catch (notifErr) {
      console.warn('Could not dispatch leave notifications to admins:', notifErr);
    }

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
    const updated = await this.prisma.leaveApplication.update({
      where: { id },
      data: { status, adminNote: adminNote ?? null },
    });

    try {
      await this.notifications.createNotification(
        updated.userId,
        `Leave Application ${status === 'approved' ? 'Approved' : 'Declined'}`,
        `Your leave request for ${updated.studentName} has been ${status}.${adminNote ? ` Reason: ${adminNote}` : ''}`,
        status === 'approved' ? 'success' : 'alert',
      );
    } catch (e) {
      console.warn('Could not dispatch notification to parent:', e);
    }

    return updated;
  }
}
