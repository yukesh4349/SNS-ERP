import { Body, Controller, Get, Patch, Post, Req } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  @Roles('admin', 'superadmin')
  updateSettings(
    @Body()
    body: {
      name?: string;
      academicYear?: string;
      timezone?: string;
      contactEmail?: string;
      contactPhone?: string;
      address?: string;
    },
  ) {
    return this.settingsService.updateSettings(body);
  }

  // ─── Promotion Endpoints ────────────────────────────────────

  @Get('promotion-preview')
  @Roles('admin', 'superadmin')
  getPromotionPreview() {
    return this.settingsService.getPromotionPreview();
  }

  @Get('promotion-history')
  @Roles('admin', 'superadmin')
  getPromotionHistory() {
    return this.settingsService.getPromotionHistory();
  }

  @Post('promote')
  @Roles('admin', 'superadmin')
  promoteStudents(
    @Body() body: {
      fromAcademicYear: string;
      toAcademicYear: string;
      students: {
        profileId: string;
        studentId: string;
        studentName: string;
        fromClass: string;
        fromSection: string;
        toClass: string;
        toSection: string;
        status: string;
      }[];
    },
    @Req() req: any,
  ) {
    return this.settingsService.promoteStudents({
      ...body,
      promotedBy: req.user?.sub ?? 'unknown',
    });
  }

  @Post('promote-rollback')
  @Roles('admin', 'superadmin')
  rollbackPromotion(@Body() body: { batchId: string }) {
    return this.settingsService.rollbackPromotion(body.batchId);
  }
}
