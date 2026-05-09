import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class RoleGroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.roleGroup.findMany({
      include: { users: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(name: string, permissions: Record<string, boolean>) {
    return this.prisma.roleGroup.create({
      data: { name, permissions },
    });
  }

  async update(id: string, data: { name?: string; permissions?: Record<string, boolean> }) {
    return this.prisma.roleGroup.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.permissions !== undefined && { permissions: data.permissions }),
      },
    });
  }

  async remove(id: string) {
    // Unassign users first
    await this.prisma.user.updateMany({
      where: { roleGroupId: id },
      data: { roleGroupId: null },
    });
    return this.prisma.roleGroup.delete({ where: { id } });
  }

  async assignUserGroup(userId: string, roleGroupId: string | null) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { roleGroupId },
    });
  }
}
