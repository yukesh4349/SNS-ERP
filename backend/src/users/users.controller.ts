import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
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

  @Get('classes')
  @Roles('admin', 'superadmin', 'leader', 'teacher')
  getClasses() {
    return this.usersService.getClasses();
  }

  @Get('stats')
  @Roles('admin', 'superadmin', 'leader', 'teacher')
  getUsersStats(@Req() req: any) {
    return this.usersService.getUsersStats(req.user.sub);
  }

  @Get('birthdays')
  @Roles('admin', 'superadmin', 'leader', 'teacher', 'parent')
  getBirthdays() {
    return this.usersService.getBirthdays();
  }

  @Get('students')
  @Roles('admin', 'superadmin', 'leader', 'teacher')
  findStudents() {
    return this.usersService.findStudents();
  }

  @Get('students-by-class/:class/:section')
  @Roles('admin', 'superadmin', 'leader', 'teacher')
  findStudentsByClass(@Param('class') className: string, @Param('section') section: string) {
    return this.usersService.findStudentsByClass(className, section);
  }

  @Get('student-details/:id')
  @Roles('admin', 'superadmin', 'leader', 'teacher')
  findStudentDetails(@Param('id') id: string) {
    return this.usersService.findStudentDetails(id);
  }

  @Get()
  @Roles('admin', 'superadmin')
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

  @Get('next-student-ids')
  @Roles('admin', 'superadmin')
  getNextStudentIds() {
    return this.usersService.getNextStudentIds();
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
  @Roles('admin', 'superadmin')
  updateRole(@Param('id') id: string, @Body('role') role: string) {
    return this.usersService.updateRole(id, role);
  }
}
