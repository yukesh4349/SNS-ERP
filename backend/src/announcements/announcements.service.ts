import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

export interface CreateAnnouncementDto {
  title: string;
  content: string;
  target: 'all' | 'parents' | 'staff';
  imageUrl?: string;
}

@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(authorId: string, data: CreateAnnouncementDto) {
    const announcement = await this.prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        target: data.target,
        imageUrl: data.imageUrl ?? null,
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    await this.notificationsService.broadcastNotification(
      data.target === 'all' ? 'both' : data.target,
      data.title,
      data.content,
    );

    return announcement;
  }

  async findAll(skip = 0, take = 20) {
    return this.prisma.announcement.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.announcement.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async update(id: string, data: Partial<CreateAnnouncementDto>) {
    return this.prisma.announcement.update({
      where: { id },
      data,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.announcement.delete({
      where: { id },
    });
  }

  async count() {
    return this.prisma.announcement.count();
  }

  async getLatestAdminNote() {
    return this.prisma.announcement.findFirst({
      where: {
        OR: [
          { target: 'all' },
          { target: 'staff' }
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            name: true,
            role: true
          }
        }
      }
    });
  }
}
