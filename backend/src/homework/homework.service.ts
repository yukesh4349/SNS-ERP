import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export class CreateHomeworkDto {
  title: string;
  description: string;
  subject: string;
  dueDate: string;
  class: string;
  section: string;
}

@Injectable()
export class HomeworkService {
  constructor(private readonly prisma: PrismaService) {}

  async create(teacherId: string, data: CreateHomeworkDto) {
    return this.prisma.homework.create({
      data: {
        ...data,
        teacherId,
      },
    });
  }

  async findByClass(cls: string, section: string) {
    return this.prisma.homework.findMany({
      where: {
        class: cls,
        section: section,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findAll() {
    return this.prisma.homework.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async delete(id: string) {
    return this.prisma.homework.delete({
      where: { id },
    });
  }
}
