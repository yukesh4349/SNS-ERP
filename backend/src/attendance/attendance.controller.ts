import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  getAttendance(@Query('date') date?: string) {
    return this.attendanceService.getAttendance(date);
  }

  @Get('student/:studentId')
  getStudentAttendance(
    @Param('studentId') studentId: string,
    @Query('month') month?: string,
  ) {
    return this.attendanceService.getStudentAttendance(studentId, month);
  }

  @Get('my-class')
  @Roles('admin', 'superadmin', 'leader', 'teacher')
  getMyClassAttendance(@CurrentUser() user: any) {
    return this.attendanceService.getClassAttendanceForTeacher(user.sub || user.id);
  }

  @Get('my-attendance')
  @Roles('admin', 'superadmin', 'leader', 'teacher')
  getMyAttendance(@CurrentUser() user: any, @Query('month') month?: string) {
    // We use the teacher's profile ID or sub
    // Based on findByIdentifier logic, attendance is likely marked against employeeId or user ID
    // Let's assume user.sub is the ID
    return this.attendanceService.getTeacherAttendance(user.sub || user.id, month);
  }

  @Post('mark')
  @Roles('admin', 'superadmin', 'teacher')
  markAttendance(
    @Body() body: {
      date: string;
      class: string;
      section: string;
      records: { studentId: string; status: string; reason?: string }[];
    },
  ) {
    const fullRecords = body.records.map((r) => ({
      ...r,
      date: body.date,
      class: body.class,
      section: body.section,
    }));
    return this.attendanceService.markAttendance(fullRecords);
  }

  @Post('mark-teacher')
  @Roles('admin', 'superadmin')
  markTeacherAttendance(
    @Body() body: {
      date: string;
      records: { teacherId: string; status: string; department?: string }[];
    },
  ) {
    const fullRecords = body.records.map((r) => ({
      studentId: r.teacherId,
      date: body.date,
      status: r.status,
      reason: undefined,
      class: 'FACULTY',
      section: r.department ?? '',
    }));
    return this.attendanceService.markAttendance(fullRecords);
  }
}
