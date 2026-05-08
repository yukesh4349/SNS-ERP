import { Body, Controller, Get, Patch } from '@nestjs/common';
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
}
