import { Body, Controller, Delete, ForbiddenException, Get, Param, Post, Query } from '@nestjs/common';
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
    const isStaff = ['admin', 'superadmin', 'leader', 'teacher'].includes(user?.role);
    if (!isStaff) {
      const allowed = await this.examsService.canAccessStudentResults(user?.sub || user?.id, studentId);
      if (!allowed) {
        throw new ForbiddenException('Access denied to exam results for this student.');
      }
    }
    if (term) return this.examsService.getStudentTermResults(studentId, term, isStaff);
    return this.examsService.getStudentResults(studentId, isStaff);
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
