import { Body, Controller, Get, Post } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('events')
  getEvents() {
    return this.calendarService.getEvents();
  }

  @Post('events')
  @Roles('admin', 'superadmin')
  createEvent(@Body() body: any) {
    return this.calendarService.createEvent(body);
  }

  @Get('my-attendance')
  @Roles('teacher')
  getMyAttendance(@CurrentUser() user: any) {
    return this.calendarService.getTeacherAttendanceSummary(user.sub);
  }
}
