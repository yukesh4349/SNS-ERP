import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
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
}
