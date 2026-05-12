import { Controller, Get, Query } from '@nestjs/common';
import { TimetableService } from './timetable.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('timetable')
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Get()
  getTimetable() {
    return this.timetableService.getTimetable();
  }

  @Get('student')
  getStudentTimetable(@Query('class') cls: string, @Query('section') section: string) {
    return this.timetableService.getStudentTimetable(cls, section);
  }

  @Get('next')
  @Roles('teacher')
  getNextPeriod(@CurrentUser() user: any) {
    return this.timetableService.getTeacherNextPeriod(user.sub);
  }

  @Get('mine')
  @Roles('teacher')
  getMyTimetable(@CurrentUser() user: any) {
    return this.timetableService.getTeacherTimetable(user.sub);
  }

  @Get('classes')
  @Roles('admin', 'superadmin', 'teacher')
  getAvailableClasses() {
    return this.timetableService.getAvailableClasses();
  }

  @Get('class')
  @Roles('admin', 'superadmin', 'teacher')
  getClassTimetable(@Query('class') cls: string, @Query('section') section: string) {
    return this.timetableService.getStudentTimetable(cls, section);
  }
}
