import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

import { RolesGuard } from '../common/guards/roles.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {
    console.log('UsersController initialized');
  }

  @Get('stats')
  @Roles('admin', 'superadmin', 'teacher')
  getStats(@CurrentUser() user: any) {
    return this.usersService.getSystemStats(user?.sub);
  }

  @Get('classes')
  @Roles('admin', 'superadmin', 'teacher')
  getClasses() {
    console.log('GET /users/classes hit');
    return this.usersService.getClasses();
  }

  @Get()
  @Roles('admin', 'superadmin', 'teacher', 'parent')
  async findAll() {
    try {
      return await this.usersService.findAll();
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw new HttpException(
        {
          message: 'Failed to load users',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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

  @Patch(':id/role')
  @Roles('superadmin', 'admin')
  updateRole(@Param('id') id: string, @Body('role') role: string) {
    return this.usersService.updateRole(id, role);
  }

  @Get('students-by-class')
  @Roles('admin', 'superadmin', 'teacher')
  getStudentsByClass(@Query('class') cls: string, @Query('section') section: string) {
    return this.usersService.getStudentsByClass(cls, section);
  }

  @Get('student-details/:id')
  @Roles('admin', 'superadmin', 'teacher')
  getStudentDetails(@Param('id') id: string) {
    return this.usersService.getStudentDetails(id);
  }
}
