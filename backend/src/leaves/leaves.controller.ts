import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { LeavesService } from './leaves.service';

@Controller('leaves')
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @Post()
  submit(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      studentName: string;
      class: string;
      section: string;
      startDate: string;
      endDate: string;
      reason: string;
      documentUrl?: string;
    },
  ) {
    return this.leavesService.submitLeave(req.user.sub, body);
  }

  @Get('mine')
  getMyLeaves(@Req() req: AuthenticatedRequest) {
    return this.leavesService.getMyLeaves(req.user.sub);
  }

  @Get()
  @Roles('admin', 'superadmin', 'leader', 'teacher')
  getAllLeaves() {
    return this.leavesService.getAllLeaves();
  }

  @Patch(':id')
  @Roles('admin', 'superadmin', 'leader')
  resolveLeave(
    @Param('id') id: string,
    @Body() body: { status: 'approved' | 'rejected'; adminNote?: string },
  ) {
    return this.leavesService.resolveLeave(id, body.status, body.adminNote);
  }
}
