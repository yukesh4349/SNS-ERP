import { Controller, Get, Req, Param } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @Roles('admin')
  getOverview() {
    return this.dashboardService.getOverview();
  }

  @Get('counts')
  @Roles('admin', 'leader', 'teacher')
  getCounts(@Req() req: any) {
    return this.dashboardService.getCounts(req.user.sub);
  }

  @Get('parent/:studentId')
  @Roles('parent', 'admin')
  getParentOverview(@Param('studentId') studentId: string) {
    return this.dashboardService.getParentOverview(studentId);
  }
}
