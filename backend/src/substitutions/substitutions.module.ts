import { Module } from '@nestjs/common';
import { SubstitutionsController } from './substitutions.controller';
import { SubstitutionsService } from './substitutions.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SubstitutionsController],
  providers: [SubstitutionsService],
})
export class SubstitutionsModule {}
