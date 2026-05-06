import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from '../common/decorators/roles.decorator';

import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {
    console.log('UsersController initialized');
  }

  @Get()
  @Roles('admin', 'superadmin')
  findAll() {
    return this.usersService.findAll();
  }

  @Post('teacher')
  @Roles('admin', 'superadmin')
  createTeacher(@Body() body: any) {
    return this.usersService.createTeacher(body);
  }

  @Post('student')
  @Roles('admin', 'superadmin')
  createStudent(@Body() body: any) {
    return this.usersService.createStudent(body);
  }

  @Delete(':id')
  @Roles('admin', 'superadmin')
  remove(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }

  @Patch(':id/status')
  @Roles('admin', 'superadmin')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.usersService.updateStatus(id, status);
  }
}
