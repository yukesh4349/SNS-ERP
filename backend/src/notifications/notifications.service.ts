import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FcmService } from './fcm.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private fcm: FcmService,
  ) {}

  async createNotification(userId: string, title: string, message: string, type: string = 'info') {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
      },
    });

    // Send push notification
    const tokens = await this.prisma.fCMToken.findMany({
      where: { userId },
      select: { token: true },
    });

    if (tokens.length > 0) {
      await this.fcm.sendPushNotification(
        tokens.map((t) => t.token),
        title,
        message,
        { notificationId: notification.id },
      );
    }

    return notification;
  }

  async broadcastNotification(
    audience: 'parents' | 'staff' | 'both',
    title: string,
    message: string,
    targetClasses?: string[],
    attachmentUrl?: string,
    attachmentName?: string,
    senderId?: string,
  ) {
    const roles: string[] = [];
    const aud = (audience || 'both').toLowerCase();
    if (aud === 'parents') {
      roles.push('parent', 'student');
    } else if (aud === 'staff') {
      roles.push('teacher', 'admin', 'leader', 'superadmin', 'head');
    } else {
      roles.push('parent', 'student', 'teacher', 'admin', 'leader', 'superadmin', 'head');
    }

    const users = await this.prisma.user.findMany({
      where: { 
        role: { in: roles as any },
        ...(targetClasses && targetClasses.length > 0 && aud === 'parents' && {
          studentProfile: {
            OR: targetClasses.map((tc) => {
              const [className, section] = tc.split('-');
              return {
                class: className,
                section: section || '',
              };
            }),
          },
        })
      },
      select: { id: true, email: true, role: true },
    });

    const userIds = users.map((u) => u.id);

    // Ensure sender has a record so it appears in their broadcast log
    if (senderId && !userIds.includes(senderId)) {
      userIds.push(senderId);
    }

    if (userIds.length > 0) {
      // Create notifications in DB for everyone
      await this.prisma.notification.createMany({
        data: userIds.map((userId) => ({
          userId,
          title,
          message,
          type: 'alert',
          attachmentUrl: attachmentUrl || null,
          attachmentName: attachmentName || null,
        })),
      });
    }

    // Simulate sending email to all recipients' mail accounts
    users.forEach((user) => {
      console.log(`[Email Service] Simulated notification email sent to ${user.role} <${user.email}>:
        Subject: ${title}
        Message: ${message}
        Attachment: ${attachmentName || 'None'}
        Attachment URL: ${attachmentUrl || 'None'}`);
    });

    // Attempt push notification with try/catch so push failure never blocks broadcast
    try {
      const tokens = await this.prisma.fCMToken.findMany({
        where: { userId: { in: userIds } },
        select: { token: true },
      });

      if (tokens.length > 0) {
        await this.fcm.sendPushNotification(
          tokens.map((t) => t.token),
          title,
          message,
        );
      }
    } catch (fcmErr) {
      console.warn('[NotificationsService] Push notification failed (handled gracefully):', fcmErr);
    }

    return { recipients: userIds.length };
  }

  async getUserNotifications(userId: string, role?: string) {
    if (role === 'admin' || role === 'superadmin' || role === 'leader' || role === 'head') {
      return this.prisma.notification.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    }
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async registerToken(userId: string, token: string, device?: string) {
    return this.prisma.fCMToken.upsert({
      where: { token },
      update: { userId, updatedAt: new Date(), device },
      create: { userId, token, device },
    });
  }

  async deleteNotification(userId: string, id: string) {
    return this.prisma.notification.delete({
      where: { id, userId },
    });
  }

  async updateNotification(userId: string, id: string, data: { title?: string, message?: string }) {
    return this.prisma.notification.update({
      where: { id, userId },
      data,
    });
  }
}
