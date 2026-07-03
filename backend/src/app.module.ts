import { Module } from '@nestjs/common';
import { AttendanceModule } from './attendance/attendance.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './health/health.module';
import { ReportsModule } from './reports/reports.module';
import { SettingsModule } from './settings/settings.module';
import { SubstitutionsModule } from './substitutions/substitutions.module';
import { TeachersModule } from './teachers/teachers.module';
import { TimetableModule } from './timetable/timetable.module';
import { UsersModule } from './users/users.module';
import { MessagingModule } from './messaging/messaging.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { LeavesModule } from './leaves/leaves.module';
import { RoleGroupsModule } from './role-groups/role-groups.module';
import { HomeworkModule } from './homework/homework.module';
import { ExamsModule } from './exams/exams.module';
import { CalendarModule } from './calendar/calendar.module';
import { UploadsModule } from './uploads/uploads.module';

import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    DatabaseModule,
    HealthModule,
    UsersModule,
    AuthModule,
    DashboardModule,
    TeachersModule,
    TimetableModule,
    AttendanceModule,
    SubstitutionsModule,
    ReportsModule,
    SettingsModule,
    MessagingModule,
    NotificationsModule,
    AnnouncementsModule,
    LeavesModule,
    RoleGroupsModule,
    HomeworkModule,
    ExamsModule,
    CalendarModule,
    UploadsModule,
  ],
  providers: [],
})
export class AppModule {}
