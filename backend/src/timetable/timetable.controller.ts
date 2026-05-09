import { Controller, Get, Query } from '@nestjs/common';
import { TimetableService } from './timetable.service';

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
}
