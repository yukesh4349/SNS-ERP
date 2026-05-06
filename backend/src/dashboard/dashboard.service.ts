import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  async getOverview() {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const currentYear = now.getFullYear();
      const yearStart = new Date(currentYear, 0, 1);

      // Batch 1: Get stats and counts (4 queries)
      const [stats, activeStudents, inactiveStudents, activeStaff] = 
        await Promise.all([
          this.usersService.getSystemStats(),
          this.prisma.user.count({ where: { role: 'parent', status: 'active' } }),
          this.prisma.user.count({ where: { role: 'parent', status: 'inactive' } }),
          this.prisma.user.count({
            where: {
              role: { in: ['teacher', 'admin', 'leader', 'superadmin'] },
              status: 'active',
            },
          }),
        ]);

      // Batch 2: Get notification and messaging counts (3 queries)
      const [unreadNotifications, groups, messages] = 
        await Promise.all([
          this.prisma.notification.count({ where: { isRead: false } }).catch(() => 0),
          this.prisma.group.count().catch(() => 0),
          this.prisma.message.count().catch(() => 0),
        ]);

      // Batch 3: Get user data (3 queries)
      const [newUsersThisWeek, recentUsers, enrollmentByMonth] = 
        await Promise.all([
          this.prisma.user.count({
            where: { createdAt: { gte: sevenDaysAgo } },
          }),
          this.prisma.user.findMany({
            where: { role: { in: ['parent', 'teacher'] } },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true,
              name: true,
              role: true,
              createdAt: true,
              status: true,
            },
          }),
          this.prisma.user.findMany({
            where: {
              role: 'parent',
              createdAt: { gte: yearStart },
            },
            select: {
              createdAt: true,
              studentProfile: { select: { gender: true } },
            },
          }),
        ]);

      // Build monthly enrollment breakdown for current year (12 months)
      const monthlyEnrollment = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        boys: 0,
        girls: 0,
      }));

      for (const user of enrollmentByMonth) {
        const month = user.createdAt.getMonth(); // 0-indexed
        const gender = (user.studentProfile?.gender ?? '').toLowerCase();
        if (gender === 'female' || gender === 'girl') {
          monthlyEnrollment[month].girls += 1;
        } else {
          monthlyEnrollment[month].boys += 1;
        }
      }

      // Normalise to percentages (relative to max month for visual scaling)
      const maxCount = Math.max(
        1,
        ...monthlyEnrollment.map((m) => m.boys + m.girls),
      );
      const monthlyChart = monthlyEnrollment.map((m) => ({
        month: m.month,
        boys: Math.round((m.boys / maxCount) * 100),
        girls: Math.round((m.girls / maxCount) * 100),
        boysCount: m.boys,
        girlsCount: m.girls,
      }));

      const recentRegistrations = recentUsers.map((u) => {
        const roleLabel =
          u.role === 'parent'
            ? 'New Student'
            : u.role === 'teacher'
              ? 'New Teacher'
              : u.role.charAt(0).toUpperCase() + u.role.slice(1);
        const diffMs = Date.now() - new Date(u.createdAt).getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);
        const dateLabel =
          diffDays === 0
            ? diffHours === 0
              ? 'Just now'
              : `Today, ${new Date(u.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
            : diffDays === 1
              ? 'Yesterday'
              : `${diffDays} days ago`;
        return { name: u.name, type: roleLabel, date: dateLabel };
      });

      return {
        stats: [
          {
            label: 'Total Students',
            value: activeStudents.toString(),
            hint: 'Live count of enrolled students in the database.',
            trend: 'Live',
          },
          {
            label: 'Total Staff',
            value: activeStaff.toString(),
            hint: 'Active faculty and administrators.',
            trend: 'Live',
          },
          {
            label: 'Inactive Students',
            value: inactiveStudents.toString(),
            hint: 'Student accounts marked inactive in the database.',
            trend: 'Live',
          },
          {
            label: 'Unread Notifications',
            value: unreadNotifications.toString(),
            hint: 'Notifications not yet marked as read.',
            trend: 'Live',
          },
        ],
        panels: [
          {
            title: 'Enrollment Summary',
            body: `${activeStudents} active students and ${inactiveStudents} inactive student records are currently stored.`,
          },
          {
            title: 'Staff Directory',
            body: `${activeStaff} active staff accounts are available across the configured departments.`,
          },
          {
            title: 'Messaging Activity',
            body: `${groups} groups and ${messages} messages are stored in the communication module.`,
          },
          {
            title: 'System Users',
            body: `${stats.totalUsers} total user accounts exist in the database.`,
          },
        ],
        quickActions: [
          {
            title: 'Manage students',
            description: 'Review active and inactive student records from the user directory.',
          },
          {
            title: 'Manage staff',
            description: 'Create teacher accounts and update department assignments.',
          },
          {
            title: 'Send notifications',
            description: 'Broadcast messages to parents, teachers, and leaders.',
          },
        ],
        newUsersThisWeek,
        recentRegistrations,
        monthlyChart,
      };
    } catch (error) {
      console.error('Dashboard overview error:', error);
      throw new HttpException(
        {
          message: 'Failed to load dashboard overview',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
