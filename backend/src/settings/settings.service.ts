import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { randomUUID } from 'crypto';

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

  // ─── Promotion Logic ──────────────────────────────────────────

  /**
   * Compute the next class from a given class string.
   * Handles: "1"→"2", "10"→"11", "LKG"→"UKG"→"1", "12"→"graduated"
   */
  private getNextClass(cls: string): string {
    const specialMap: Record<string, string> = {
      'LKG': 'UKG',
      'UKG': '1',
      'Nursery': 'LKG',
      'Pre-KG': 'LKG',
    };
    const upper = cls.trim();
    if (specialMap[upper]) return specialMap[upper];
    const num = parseInt(upper, 10);
    if (!isNaN(num)) {
      if (num >= 12) return 'graduated';
      return String(num + 1);
    }
    // Try extracting number from strings like "Grade 5"
    const match = upper.match(/(\d+)/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n >= 12) return 'graduated';
      return upper.replace(match[1], String(n + 1));
    }
    return 'graduated';
  }

  /**
   * Returns a preview of what promotion would look like.
   * Groups all active students by class-section and shows the next class.
   */
  async getPromotionPreview() {
    const settings = await this.ensureSettings();
    const students = await this.prisma.studentProfile.findMany({
      include: { user: { select: { name: true, status: true } } },
      orderBy: [{ class: 'asc' }, { section: 'asc' }],
    });

    const activeStudents = students.filter((s) => s.user.status === 'active');

    // Group by class-section
    const groups: Record<string, { class: string; section: string; students: typeof activeStudents }> = {};
    activeStudents.forEach((s) => {
      const key = `${s.class}-${s.section}`;
      if (!groups[key]) groups[key] = { class: s.class, section: s.section, students: [] };
      groups[key].students.push(s);
    });

    const preview = Object.values(groups).map((g) => ({
      fromClass: g.class,
      fromSection: g.section,
      toClass: this.getNextClass(g.class),
      toSection: g.section, // section preserved
      studentCount: g.students.length,
      students: g.students.map((s) => ({
        profileId: s.id,
        studentId: s.studentId,
        name: s.user.name,
        currentClass: s.class,
        currentSection: s.section,
      })),
    }));

    return {
      currentAcademicYear: settings.academicYear,
      totalStudents: activeStudents.length,
      classGroups: preview,
    };
  }

  /**
   * Execute promotion. Updates each student's class/section and creates audit logs.
   * All records in one batch share the same batchId for rollback.
   */
  async promoteStudents(body: {
    fromAcademicYear: string;
    toAcademicYear: string;
    promotedBy: string;
    students: {
      profileId: string;
      studentId: string;
      studentName: string;
      fromClass: string;
      fromSection: string;
      toClass: string;
      toSection: string;
      status: string; // promoted | failed | transferred | discontinued
    }[];
  }) {
    if (!body.students.length) throw new BadRequestException('No students to promote.');

    const batchId = randomUUID();

    // Create all PromotionLog entries
    await this.prisma.promotionLog.createMany({
      data: body.students.map((s) => ({
        batchId,
        studentProfileId: s.profileId,
        studentId: s.studentId,
        studentName: s.studentName,
        fromClass: s.fromClass,
        fromSection: s.fromSection,
        toClass: s.status === 'promoted' ? s.toClass : s.fromClass,
        toSection: s.status === 'promoted' ? s.toSection : s.fromSection,
        fromAcademicYear: body.fromAcademicYear,
        toAcademicYear: body.toAcademicYear,
        status: s.status,
        promotedBy: body.promotedBy,
      })),
    });

    // Update each student's class/section based on their status
    let promoted = 0;
    let failed = 0;
    let transferred = 0;
    let discontinued = 0;
    let graduated = 0;

    for (const s of body.students) {
      if (s.status === 'promoted') {
        if (s.toClass === 'graduated') {
          // Mark as graduated (inactive)
          await this.prisma.studentProfile.update({
            where: { id: s.profileId },
            data: { class: 'graduated', section: '' },
          });
          graduated++;
        } else {
          await this.prisma.studentProfile.update({
            where: { id: s.profileId },
            data: { class: s.toClass, section: s.toSection },
          });
          promoted++;
        }
      } else if (s.status === 'failed') {
        // Stay in same class — no update needed
        failed++;
      } else if (s.status === 'transferred' || s.status === 'discontinued') {
        // Set user to inactive
        const profile = await this.prisma.studentProfile.findUnique({ where: { id: s.profileId } });
        if (profile) {
          await this.prisma.user.update({
            where: { id: profile.userId },
            data: { status: 'inactive' },
          });
        }
        s.status === 'transferred' ? transferred++ : discontinued++;
      }
    }

    // Update the school's academic year
    await this.prisma.schoolSettings.update({
      where: { id: 'singleton' },
      data: { academicYear: body.toAcademicYear },
    });

    return {
      message: 'Promotion completed successfully.',
      batchId,
      summary: { promoted, failed, transferred, discontinued, graduated, total: body.students.length },
    };
  }

  /**
   * Rollback a promotion batch. Restores each student's original class/section.
   */
  async rollbackPromotion(batchId: string) {
    const logs = await this.prisma.promotionLog.findMany({
      where: { batchId, rolledBack: false },
    });

    if (!logs.length) throw new BadRequestException('No promotion batch found or already rolled back.');

    let restored = 0;

    for (const log of logs) {
      if (log.status === 'promoted' || log.status === 'graduated') {
        // Restore original class/section
        await this.prisma.studentProfile.update({
          where: { id: log.studentProfileId },
          data: { class: log.fromClass, section: log.fromSection },
        });
        restored++;
      } else if (log.status === 'transferred' || log.status === 'discontinued') {
        // Re-activate the user
        const profile = await this.prisma.studentProfile.findUnique({ where: { id: log.studentProfileId } });
        if (profile) {
          await this.prisma.user.update({
            where: { id: profile.userId },
            data: { status: 'active' },
          });
        }
        restored++;
      }
      // 'failed' students didn't change class, nothing to restore
    }

    // Mark all logs as rolled back
    await this.prisma.promotionLog.updateMany({
      where: { batchId },
      data: { rolledBack: true, rolledBackAt: new Date() },
    });

    // Restore previous academic year
    const firstLog = logs[0];
    await this.prisma.schoolSettings.update({
      where: { id: 'singleton' },
      data: { academicYear: firstLog.fromAcademicYear },
    });

    return {
      message: `Rollback completed. ${restored} students restored.`,
      batchId,
      restored,
    };
  }

  /**
   * Returns promotion history — past batches.
   */
  async getPromotionHistory() {
    const logs = await this.prisma.promotionLog.findMany({
      orderBy: { promotedAt: 'desc' },
    });

    // Group by batchId
    const batches: Record<string, {
      batchId: string;
      fromAcademicYear: string;
      toAcademicYear: string;
      promotedAt: Date;
      promotedBy: string;
      rolledBack: boolean;
      students: typeof logs;
    }> = {};

    logs.forEach((log) => {
      if (!batches[log.batchId]) {
        batches[log.batchId] = {
          batchId: log.batchId,
          fromAcademicYear: log.fromAcademicYear,
          toAcademicYear: log.toAcademicYear,
          promotedAt: log.promotedAt,
          promotedBy: log.promotedBy,
          rolledBack: log.rolledBack,
          students: [],
        };
      }
      batches[log.batchId].students.push(log);
    });

    return Object.values(batches).map((b) => ({
      batchId: b.batchId,
      fromAcademicYear: b.fromAcademicYear,
      toAcademicYear: b.toAcademicYear,
      promotedAt: b.promotedAt,
      rolledBack: b.rolledBack,
      totalStudents: b.students.length,
      promoted: b.students.filter((s) => s.status === 'promoted').length,
      failed: b.students.filter((s) => s.status === 'failed').length,
      transferred: b.students.filter((s) => s.status === 'transferred').length,
      discontinued: b.students.filter((s) => s.status === 'discontinued').length,
      graduated: b.students.filter((s) => s.status === 'graduated').length,
    }));
  }
}
