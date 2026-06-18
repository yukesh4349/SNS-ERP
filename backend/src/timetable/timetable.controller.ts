import { Controller, Get, Post, Put, Query, Body } from '@nestjs/common';
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
    return this.timetableService.getClassTimetable(cls, section);
  }

  @Post('class')
  @Roles('admin', 'superadmin')
  saveClassTimetable(
    @Body() body: {
      class: string;
      section: string;
      entries: {
        day: string;
        period: number;
        subject: string;
        startTime: string;
        endTime: string;
        teacherId?: string;
      }[];
    },
  ) {
    return this.timetableService.saveClassTimetable(body.class, body.section, body.entries);
  }

  @Get('config')
  getConfig() {
    return this.timetableService.getConfig();
  }

  @Put('config')
  @Roles('admin', 'superadmin')
  updateConfig(
    @Body() body: {
      periodsCount: number;
      lunchAfterPeriod: number;
      timings: { period: number; start: string; end: string }[];
    },
  ) {
    return this.timetableService.updateConfig(body);
  }

  @Get('class-config')
  @Roles('admin', 'superadmin', 'teacher')
  getClassConfig(@Query('class') cls: string, @Query('section') section: string) {
    return this.timetableService.getClassConfig(cls, section);
  }

  @Put('class-config')
  @Roles('admin', 'superadmin')
  updateClassConfig(
    @Body() body: {
      class: string;
      section: string;
      periodsCount: number;
      lunchAfterPeriod: number;
      timings: { period: number; start: string; end: string }[];
    },
  ) {
    return this.timetableService.updateClassConfig(body.class, body.section, {
      periodsCount: body.periodsCount,
      lunchAfterPeriod: body.lunchAfterPeriod,
      timings: body.timings,
    });
  }
}
