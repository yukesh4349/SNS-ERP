import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { SubstitutionsService } from './substitutions.service';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('substitutions')
export class SubstitutionsController {
  constructor(private readonly substitutionsService: SubstitutionsService) {}

  @Get()
  findAll() {
    return this.substitutionsService.getSubstitutions();
  }

  @Get('available')
  getAvailable(
    @Query('date') date: string,
    @Query('period') period: string,
    @Query('absentTeacherId') absentTeacherId: string,
  ) {
    return this.substitutionsService.getAvailableSubstitutes(date, parseInt(period), absentTeacherId);
  }

  @Post()
  @Roles('admin', 'superadmin', 'leader')
  create(@Body() data: any) {
    return this.substitutionsService.createSubstitution(data);
  }
}
