import { Controller, Get, Req, UseGuards, Param } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('dashboard')
@UseGuards(AuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @Roles('admin', 'superadmin')
  getOverview() {
    return this.dashboardService.getOverview();
  }

  @Get('counts')
  @Roles('admin', 'superadmin', 'leader', 'teacher')
  getCounts(@Req() req: any) {
    return this.dashboardService.getCounts(req.user.id);
  }

  @Get('parent/:studentId')
  @Roles('parent', 'admin', 'superadmin')
  getParentOverview(@Param('studentId') studentId: string) {
    return this.dashboardService.getParentOverview(studentId);
  }
}
