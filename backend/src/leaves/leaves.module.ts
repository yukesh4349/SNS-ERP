import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';
import { LeavesController } from './leaves.controller';
import { LeavesService } from './leaves.service';

@Module({
  imports: [NotificationsModule, AuthModule],
  controllers: [LeavesController],
  providers: [LeavesService],
})
export class LeavesModule {}
