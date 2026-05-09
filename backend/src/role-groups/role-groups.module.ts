import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RoleGroupsController } from './role-groups.controller';
import { RoleGroupsService } from './role-groups.service';

@Module({
  imports: [AuthModule],
  controllers: [RoleGroupsController],
  providers: [RoleGroupsService],
})
export class RoleGroupsModule {}
