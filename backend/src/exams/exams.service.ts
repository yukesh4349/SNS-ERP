import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export class CreateExamResultDto {
  studentId: string;
  term: string;
  subject: string;
  internal: number;
  exam: number;
  total: number;
  grade: string;
  remarks?: string;
  academicYear: string;
}

@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) {}

  async createResult(data: CreateExamResultDto) {
    return this.prisma.examResult.create({
      data,
    });
  }

  async getStudentResults(studentId: string) {
    return this.prisma.examResult.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStudentTermResults(studentId: string, term: string) {
    return this.prisma.examResult.findMany({
      where: { studentId, term },
    });
  }

  private calcGrade(total: number, max: number): string {
    const pct = (total / max) * 100;
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'A-';
    if (pct >= 60) return 'B+';
    if (pct >= 50) return 'B';
    return 'C';
  }

  async bulkSaveResults(data: {
    class: string;
    section: string;
    term: string;
    academicYear: string;
    students: { studentId: string; name: string; subjects: { subject: string; internal: number; exam: number; total: number }[] }[];
  }) {
    const records: any[] = [];
    for (const student of data.students) {
      for (const s of student.subjects) {
        records.push(
          this.prisma.examResult.upsert({
            where: { studentId_term_subject: { studentId: student.studentId, term: data.term, subject: s.subject } } as any,
            create: {
              studentId: student.studentId,
              term: data.term,
              subject: s.subject,
              internal: s.internal,
              exam: s.exam,
              total: s.total,
              grade: this.calcGrade(s.total, 100),
              academicYear: data.academicYear,
            },
            update: {
              internal: s.internal,
              exam: s.exam,
              total: s.total,
              grade: this.calcGrade(s.total, 100),
            },
          }),
        );
      }
    }
    const results = await Promise.all(records);
    return { saved: results.length };
  }

  async createSchedule(data: {
    class: string; section: string; subject: string; examDate: string;
    startTime: string; duration?: string; hall?: string; term: string; academicYear: string;
  }) {
    return this.prisma.examSchedule.create({ data });
  }

  async getScheduleByClass(cls: string, section: string, term?: string) {
    const where: any = { class: cls, section };
    if (term) where.term = term;
    return this.prisma.examSchedule.findMany({ where, orderBy: { examDate: 'asc' } });
  }

  async deleteSchedule(id: string) {
    return this.prisma.examSchedule.delete({ where: { id } });
  }
}
