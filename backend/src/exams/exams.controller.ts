import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ExamsService, CreateExamResultDto } from './exams.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post('results')
  @Roles('admin', 'superadmin', 'teacher')
  async createResult(@Body() data: CreateExamResultDto) {
    return this.examsService.createResult(data);
  }

  @Post('results/bulk')
  @Roles('admin', 'superadmin', 'teacher')
  async bulkSaveResults(@Body() data: any) {
    return this.examsService.bulkSaveResults(data);
  }

  @Get('results/:studentId')
  async getStudentResults(
    @Param('studentId') studentId: string,
    @CurrentUser() user: any,
    @Query('term') term?: string,
  ) {
    const isAdminOrTeacher = user.role === 'admin' || user.role === 'superadmin' || user.role === 'teacher';
    if (term) return this.examsService.getStudentTermResults(studentId, term, isAdminOrTeacher);
    return this.examsService.getStudentResults(studentId, isAdminOrTeacher);
  }

  @Post('results/approve')
  @Roles('admin', 'superadmin')
  async approveResults(@Body() data: { class: string; section: string; term: string }) {
    return this.examsService.approveResults(data.class, data.section, data.term);
  }

  @Get('schedule')
  async getSchedule(
    @Query('class') cls: string,
    @Query('section') section: string,
    @Query('term') term?: string,
  ) {
    return this.examsService.getScheduleByClass(cls, section, term);
  }

  @Post('schedule')
  @Roles('admin', 'superadmin', 'teacher')
  async createSchedule(@Body() data: any) {
    return this.examsService.createSchedule(data);
  }

  @Delete('schedule/:id')
  @Roles('admin', 'superadmin', 'teacher')
  async deleteSchedule(@Param('id') id: string) {
    return this.examsService.deleteSchedule(id);
  }
}
