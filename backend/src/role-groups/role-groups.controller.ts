import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { RoleGroupsService } from './role-groups.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('role-groups')
@UseGuards(AuthGuard, RolesGuard)
export class RoleGroupsController {
  constructor(private readonly service: RoleGroupsService) {}

  @Get()
  @Roles('admin', 'superadmin')
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @Roles('admin', 'superadmin')
  create(@Body('name') name: string, @Body('permissions') permissions: Record<string, boolean>) {
    return this.service.create(name, permissions ?? {});
  }

  @Patch(':id')
  @Roles('admin', 'superadmin')
  update(@Param('id') id: string, @Body() body: { name?: string; permissions?: Record<string, boolean> }) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @Roles('admin', 'superadmin')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Patch(':userId/assign')
  @Roles('admin', 'superadmin')
  assignUser(@Param('userId') userId: string, @Body('roleGroupId') roleGroupId: string | null) {
    return this.service.assignUserGroup(userId, roleGroupId || null);
  }
}
