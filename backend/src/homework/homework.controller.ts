import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { HomeworkService, CreateHomeworkDto } from './homework.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('homework')
export class HomeworkController {
  constructor(private readonly homeworkService: HomeworkService) {}

  @Post()
  @Roles('admin', 'superadmin', 'teacher')
  async create(@CurrentUser() user: any, @Body() data: CreateHomeworkDto) {
    return this.homeworkService.create(user.sub, data);
  }

  @Get()
  async findAll(@Query('class') cls?: string, @Query('section') section?: string) {
    if (cls && section) {
      return this.homeworkService.findByClass(cls, section);
    }
    return this.homeworkService.findAll();
  }

  @Delete(':id')
  @Roles('admin', 'superadmin', 'teacher')
  async delete(@Param('id') id: string) {
    return this.homeworkService.delete(id);
  }
}
